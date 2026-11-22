import { NextRequest, NextResponse } from "next/server";
import { applyRequestRateLimit } from "@/src/lib/rate-limit";

const stripQuotes = (v: string | undefined) => (v ?? "").trim().replace(/^['"]|['"]$/g, "");

const LINE_TOKEN = stripQuotes(process.env.LINE_CHANNEL_ACCESS_TOKEN);
const GROUP_ID = stripQuotes(process.env.LINE_GROUP_ID); // Group ID ที่จะส่งเข้ากลุ่ม

/**
 * POST /api/notify: tells the team in LINE that a chat visitor asked for a person.
 * Public (the chat widget calls it), so the text is fixed here and the caller's
 * body is ignored; before this, anyone could post any text into the group.
 */
export async function POST(req: NextRequest) {
  const limited = applyRequestRateLimit(req, {
    scope: "chat-handoff-notify",
    limit: 3,
    windowMs: 10 * 60 * 1000,
    message: "แจ้งเจ้าหน้าที่ไปแล้ว กรุณารอสักครู่",
  });
  if (limited) return limited;

  if (!LINE_TOKEN || !GROUP_ID) {
    return NextResponse.json({ error: "LINE_CHANNEL_ACCESS_TOKEN or LINE_GROUP_ID missing" }, { status: 500 });
  }

  const message = [
    "🔔 มีลูกค้าขอเจ้าหน้าที่ดูแล!",
    `🕐 เวลา: ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`,
    "กรุณาตรวจสอบและติดต่อกลับลูกค้าโดยเร็วที่สุดด้วยครับ!",
    "www.truefiberhome.com/dashboard/chat",
  ].join("\n");

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_TOKEN}`,
    },
    body: JSON.stringify({
      to: GROUP_ID,
      messages: [{ type: "text", text: message }],
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
