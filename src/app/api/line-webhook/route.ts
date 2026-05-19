import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const stripQuotes = (v: string | undefined) =>
  (v ?? "").trim().replace(/^['"]|['"]$/g, "");

const SECRET = stripQuotes(process.env.LINE_CHANNEL_SECRET);
const LINE_TOKEN = stripQuotes(process.env.LINE_CHANNEL_ACCESS_TOKEN);

function verifySignature(body: string, signature: string) {
  if (!SECRET) return false;
  const hash = crypto.createHmac("sha256", SECRET).update(body).digest("base64");
  return hash === signature;
}

type LineSource = {
  type: "user" | "group" | "room";
  userId?: string;
  groupId?: string;
  roomId?: string;
};

async function reply(replyToken: string, text: string) {
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: "text", text }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("LINE reply failed:", res.status, errText);
    }
  } catch (e) {
    console.error("LINE reply error:", e);
  }
}

function summarizeSource(source: LineSource | undefined): string {
  if (!source) return "(no source)";
  switch (source.type) {
    case "group":
      return `📦 Group ID:\n${source.groupId}\n\n👤 ผู้พิมพ์:\n${source.userId ?? "(unknown)"}`;
    case "room":
      return `🏠 Room ID:\n${source.roomId}\n\n👤 ผู้พิมพ์:\n${source.userId ?? "(unknown)"}`;
    case "user":
      return `👤 User ID:\n${source.userId}`;
    default:
      return `(unknown source type)`;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature") || "";

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const events = JSON.parse(body).events ?? [];

  for (const event of events) {
    const source: LineSource | undefined = event.source;

    // บอทถูกเชิญเข้ากลุ่ม → ตอบกลุ่มทันทีว่า ID อะไร
    if (event.type === "join" && event.replyToken) {
      console.log("★★★ Bot joined:", JSON.stringify(source));
      await reply(
        event.replyToken,
        `สวัสดีครับ 👋\nเอา ID ด้านล่างไปใส่ LINE_GROUP_ID ใน Vercel:\n\n` +
          summarizeSource(source),
      );
      continue;
    }

    // มีคนพิมพ์ข้อความ
    if (event.type === "message" && event.message?.type === "text") {
      const text: string = event.message.text ?? "";
      console.log(`[LINE msg] source=${JSON.stringify(source)} text=${text}`);
      if (source?.groupId) {
        console.log(`★★★ Group ID = ${source.groupId} ★★★`);
      }

      // คำสั่ง "id" หรือ "/id" → ตอบ ID ของที่นั่น
      if (/^\s*\/?id\b/i.test(text) && event.replyToken) {
        await reply(event.replyToken, summarizeSource(source));
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: 'พิมพ์ "id" ในแชต/กลุ่ม → บอทจะตอบ Group ID/User ID ที่ต้องเอาไปใส่ env',
  });
}
