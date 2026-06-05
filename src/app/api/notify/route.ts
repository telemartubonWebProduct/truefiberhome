import { NextRequest, NextResponse } from 'next/server';

const stripQuotes = (v: string | undefined) =>
  (v ?? '').trim().replace(/^['"]|['"]$/g, '');

const LINE_TOKEN = stripQuotes(process.env.LINE_CHANNEL_ACCESS_TOKEN);
const GROUP_ID = stripQuotes(process.env.LINE_GROUP_ID); // Group ID ที่จะส่งเข้ากลุ่ม

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!LINE_TOKEN || !GROUP_ID) {
    return NextResponse.json(
      { error: 'LINE_CHANNEL_ACCESS_TOKEN or LINE_GROUP_ID missing' },
      { status: 500 },
    );
  }

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_TOKEN}`,
    },
    body: JSON.stringify({
      to: GROUP_ID,
      messages: [{ type: 'text', text: message }],
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}