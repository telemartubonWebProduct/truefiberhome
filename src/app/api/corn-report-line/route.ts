import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getMonthDateRange, getCurrentMonthKey, getTodayInputValue, summarizeDailyPerformance } from '@/src/lib/daily-performance';

const stripQuotes = (v: string | undefined) =>
  (v ?? '').trim().replace(/^['"]|['"]$/g, '');

const LINE_TOKEN = stripQuotes(process.env.LINE_CHANNEL_ACCESS_TOKEN);
const GROUP_ID = stripQuotes(process.env.LINE_GROUP_ID);
const CRON_SECRET = stripQuotes(process.env.CRON_SECRET);


export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secretParam = req.nextUrl.searchParams.get('secret');
  
  // อนุญาตทั้งแบบ Bearer token (สำหรับ Cron) และ Query param (สำหรับทดสอบแมนนวลแบบ GET)
  if (authHeader !== `Bearer ${CRON_SECRET}` && secretParam !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return await sendReport();
}

export async function POST(req: NextRequest) {
  // สำหรับให้ Dashboard Admin กดใช้งาน (ควรมีการเช็ค Session ของ Admin ตรงนี้เพิ่มเติมในภายหลัง)
  return await sendReport();
}

async function sendReport() {
  if (!LINE_TOKEN || !GROUP_ID) {
    const missing = [
      !LINE_TOKEN && 'LINE_CHANNEL_ACCESS_TOKEN',
      !GROUP_ID && 'LINE_GROUP_ID',
    ].filter(Boolean);
    console.error('LINE config missing:', missing);
    return NextResponse.json(
      { error: 'LINE configuration missing', missing },
      { status: 500 },
    );
  }

  // สร้างวันที่ภาษาไทย
  const now = new Date();
  const thaiDate = now.toLocaleDateString('th-TH', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // ดึงข้อมูลยอดขายจาก Database ของเดือนนี้
  const monthKey = getCurrentMonthKey();
  const { startDate, endDate } = getMonthDateRange(monthKey);
  const todayStr = getTodayInputValue();

  const dailyPerformanceLog = (prisma as any).dailyPerformanceLog;
  const isDelegateReady = typeof dailyPerformanceLog?.findMany === "function";

  const rows = isDelegateReady
    ? await dailyPerformanceLog.findMany({
        where: {
          recordDate: {
            gte: startDate,
            lt: endDate,
          },
        },
      })
    : [];

  const summary = summarizeDailyPerformance(rows);
  const todayRow = rows.find((r: any) => r.recordDate.toISOString().startsWith(todayStr)) || {
    installSuccess: 0,
    pendingInstall: 0,
    installFailed: 0,
    salesSuccess: 0,
  };

  const regis = summary.totalInstallSuccess + summary.totalPendingInstall + summary.totalInstallFailed;
  const connect = summary.totalInstallSuccess;
  const wait = summary.totalPendingInstall;
  const cannotInstall = summary.totalInstallFailed;
  
  const todaySales = todayRow.salesSuccess ?? 0;
  const totalSales = summary.totalSalesSuccess;

  const reportData = `📊 รายงานยอดขายออนไลน์ประจำวัน
🗓️ ${thaiDate}

📌 สถานะงาน (Regis/Connect)
🌐 ออนไลน์: (${regis}/${connect}) | ⏳ รอ: ${wait} | ❌ ติดไม่ได้: ${cannotInstall}

➖➖➖➖➖➖➖➖➖➖
🎯 ยอดขายวันนี้: ${todaySales} Sub
📈 ยอดขายรวม: ${totalSales} Sub`;

  // 3. ยิง Push Message เข้ากลุ่ม
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_TOKEN}`,
    },
    body: JSON.stringify({
      to: GROUP_ID,
      messages: [{ type: 'text', text: reportData }],
    }),
  });

  if (!res.ok) {
    const raw = await res.text();
    let parsed: unknown = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {}
    console.error(
      'LINE API Error:',
      JSON.stringify(
        {
          status: res.status,
          requestId: res.headers.get('x-line-request-id'),
          toPrefix: GROUP_ID.slice(0, 2),
          toLen: GROUP_ID.length,
          body: parsed,
        },
        null,
        2,
      ),
    );
    return NextResponse.json(
      { error: parsed, status: res.status },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, message: 'Report sent to group!' });
}