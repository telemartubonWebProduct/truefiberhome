import { NextRequest, NextResponse } from 'next/server';

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

  // ตัวแปรจำลองสำหรับข้อมูลยอดขาย (ที่ต้องไปดึงจาก Database)
  const regis = 11;
  const connect = 8;
  const wait = 1;
  const cannotInstall = 2;
  const today = 0;
  const totalSub = 11;

  const reportData = `📊 สรุปยอดขายออนไลน์ประจำวัน
📅 ประจำวันที่: ${thaiDate}

📌 สถานะงาน (Regis / Connect)
🌐 ออนไลน์: ${regis} / ${connect}
⏳ รอติดตั้ง: ${wait}
❌ ติดไม่ได้: ${cannotInstall}

➖➖➖➖➖➖➖➖➖
🎯 ยอดขายวันนี้ = ${today}
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