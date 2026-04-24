import { NextRequest, NextResponse } from 'next/server';

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const USER_ID = process.env.LINE_USER_ID!; // User ID ที่จะส่งหา

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_TOKEN}`,
    },
    body: JSON.stringify({
      to: USER_ID,
      messages: [{ type: 'text', text: message }],
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}