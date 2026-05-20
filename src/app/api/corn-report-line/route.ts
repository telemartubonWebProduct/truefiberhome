import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import {
  getMonthDateRange,
  getCurrentMonthKey,
  getTodayInputValue,
  summarizeDailyPerformance,
} from '@/src/lib/daily-performance';
import {
  buildDailyReportFlex,
  buildDailyReportText,
  type DailyReportStats,
} from '@/src/lib/line-flex-report';

const stripQuotes = (v: string | undefined) =>
  (v ?? '').trim().replace(/^['"]|['"]$/g, '');

const LINE_TOKEN = stripQuotes(process.env.LINE_CHANNEL_ACCESS_TOKEN);
const GROUP_ID = stripQuotes(process.env.LINE_GROUP_ID);
const CRON_SECRET = stripQuotes(process.env.CRON_SECRET);

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';

const maskId = (id: string) =>
  id ? `${id.slice(0, 2)}…${id.slice(-3)} (len=${id.length})` : '(empty)';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secretParam = req.nextUrl.searchParams.get('secret');

  if (authHeader !== `Bearer ${CRON_SECRET}` && secretParam !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return await sendReport();
}

export async function POST() {
  return await sendReport();
}

async function pushLine(to: string, messages: unknown[]) {
  const res = await fetch(LINE_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_TOKEN}`,
    },
    body: JSON.stringify({ to, messages }),
  });

  if (res.ok) return { ok: true as const, status: res.status };

  const raw = await res.text();
  let body: unknown = raw;
  try {
    body = JSON.parse(raw);
  } catch {}
  return {
    ok: false as const,
    status: res.status,
    requestId: res.headers.get('x-line-request-id'),
    body,
  };
}

async function sendReport() {
  if (!LINE_TOKEN) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN missing');
    return NextResponse.json(
      { error: 'LINE_CHANNEL_ACCESS_TOKEN missing' },
      { status: 500 },
    );
  }
  if (!GROUP_ID) {
    console.error('LINE_GROUP_ID missing');
    return NextResponse.json(
      { error: 'LINE_GROUP_ID missing' },
      { status: 500 },
    );
  }

  const now = new Date();
  const thaiDate = now.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const monthKey = getCurrentMonthKey();
  const { startDate, endDate } = getMonthDateRange(monthKey);
  const todayStr = getTodayInputValue();

  const dailyPerformanceLog = (prisma as any).dailyPerformanceLog;
  const isDelegateReady = typeof dailyPerformanceLog?.findMany === 'function';

  const rows = isDelegateReady
    ? await dailyPerformanceLog.findMany({
        where: { recordDate: { gte: startDate, lt: endDate } },
      })
    : [];

  const summary = summarizeDailyPerformance(rows);
  const todayRow =
    rows.find((r: any) => r.recordDate.toISOString().startsWith(todayStr)) || {
      installSuccess: 0,
      pendingInstall: 0,
      installFailed: 0,
      salesSuccess: 0,
    };

  const stats: DailyReportStats = {
    thaiDate,
    regis:
      summary.totalInstallSuccess +
      summary.totalPendingInstall +
      summary.totalInstallFailed,
    connect: summary.totalInstallSuccess,
    wait: summary.totalPendingInstall,
    cannotInstall: summary.totalInstallFailed,
    todaySales: todayRow.salesSuccess ?? 0,
    totalSales: summary.totalSalesSuccess,
  };

  const flexMessage = buildDailyReportFlex(stats);
  const textMessage = { type: 'text' as const, text: buildDailyReportText(stats) };

  // ส่งเข้ากลุ่มเท่านั้น: ลอง Flex ก่อน ถ้าไม่สำเร็จจึง fallback เป็น Text
  const attempts: Array<{
    to: string;
    kind: 'flex' | 'text';
    messages: unknown[];
  }> = [
    { to: GROUP_ID, kind: 'flex', messages: [flexMessage] },
    { to: GROUP_ID, kind: 'text', messages: [textMessage] },
  ];

  const failures: Array<Record<string, unknown>> = [];
  for (const attempt of attempts) {
    const result = await pushLine(attempt.to, attempt.messages);
    if (result.ok) {
      if (failures.length > 0) {
        console.warn(
          'LINE report sent after fallbacks:',
          JSON.stringify({ winner: { to: maskId(attempt.to), kind: attempt.kind }, failures }, null, 2),
        );
      }
      return NextResponse.json({
        success: true,
        sentAs: attempt.kind,
        recipient: maskId(attempt.to),
        fallbackCount: failures.length,
      });
    }
    failures.push({
      to: maskId(attempt.to),
      kind: attempt.kind,
      status: result.status,
      requestId: result.requestId,
      body: result.body,
    });
  }

  console.error('LINE report all attempts failed:', JSON.stringify(failures, null, 2));
  return NextResponse.json(
    { error: 'All LINE send attempts failed', attempts: failures },
    { status: 500 },
  );
}
