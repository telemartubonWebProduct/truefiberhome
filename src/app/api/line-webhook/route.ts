import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SECRET = process.env.LINE_CHANNEL_SECRET!;

function verifySignature(body: string, signature: string) {
  const hash = crypto
    .createHmac("sha256", SECRET)
    .update(body)
    .digest("base64");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature") || "";

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const events = JSON.parse(body).events;

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const userId = event.source.userId;
      const text = event.message.text;
      console.log(`User ${userId} sent: ${text}`);
      // ทำ logic ต่อจากนี้...
    }
  }

  return NextResponse.json({ status: "ok" });
}