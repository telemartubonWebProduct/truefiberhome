import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getMonthDateRange, getCurrentMonthKey, getTodayInputValue, summarizeDailyPerformance } from '@/src/lib/daily-performance';

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const GROUP_ID = process.env.LINE_GROUP_ID!;
const CRON_SECRET = process.env.CRON_SECRET!; 


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
  };

  const regis = summary.totalInstallSuccess + summary.totalPendingInstall + summary.totalInstallFailed;
  const connect = summary.totalInstallSuccess;
  const wait = summary.totalPendingInstall;
  const cannotInstall = summary.totalInstallFailed;
  
  const todayRegis = todayRow.installSuccess + todayRow.pendingInstall + todayRow.installFailed;
  const totalSub = regis;

  const reportData = `📊 สรุปยอดขายออนไลน์ประจำวัน
📅 ประจำวันที่: ${thaiDate}

📌 สถานะงาน (Regis / Connect)
🌐 ออนไลน์: ${regis} / ${connect}
⏳ รอติดตั้ง: ${wait}
❌ ติดไม่ได้: ${cannotInstall}

➖➖➖➖➖➖➖➖➖
🎯 ยอดขายวันนี้ = ${todayRegis}
📈 รวมทั้งหมด = ${totalSub} Sub`;

  // 3. ยิง Push Message เข้ากลุ่ม
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_TOKEN}`,
    },
    body: JSON.stringify({
      to: GROUP_ID, // ระบุปลายทางเป็น Group ID
      messages: [{ type: 'text', text: reportData }],
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    console.error('LINE API Error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Report sent to group!' });
}