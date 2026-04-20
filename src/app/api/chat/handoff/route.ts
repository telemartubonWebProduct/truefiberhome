import { NextResponse } from "next/server";
import {
  getVisitorIdFromRequest,
  nonEmptyString,
  serializeChatSession,
} from "@/src/lib/chat";
import { cleanupExpiredChatSessionsSafely } from "@/src/lib/chat-retention";
import { getOptionalAdmin } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";
import { applyRequestRateLimit } from "@/src/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await cleanupExpiredChatSessionsSafely();

    const body = await request.json().catch(() => ({}));
    const sessionId = nonEmptyString(body.sessionId);

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const visitorId = getVisitorIdFromRequest(request);
    const { admin } = await getOptionalAdmin();

    if (!admin && (!visitorId || visitorId !== session.visitorId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rateLimited = applyRequestRateLimit(request, {
      scope: admin ? "chat-handoff-admin" : "chat-handoff-visitor",
      limit: admin ? 60 : 6,
      windowMs: 60_000,
      identifier: admin ? `admin:${admin.id}` : `visitor:${visitorId || session.visitorId}`,
      message: "ส่งคำขอเจ้าหน้าที่ถี่เกินไป กรุณารอสักครู่",
    });

    if (rateLimited) {
      return rateLimited;
    }

    if (session.status === "CLOSED") {
      return NextResponse.json({ error: "Session is closed" }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          status: "WAITING_FOR_ADMIN",
          updatedAt: new Date(),
        },
      }),
      prisma.chatMessage.create({
        data: {
          sessionId,
          senderType: "SYSTEM",
          content: "ลูกค้าต้องการคุยกับเจ้าหน้าที่",
        },
      }),
    ]);

    const updated = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!updated) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(serializeChatSession(updated));
  } catch (error) {
    console.error("POST /api/chat/handoff failed:", error);
    return NextResponse.json({ error: "Failed to request handoff" }, { status: 500 });
  }
}
