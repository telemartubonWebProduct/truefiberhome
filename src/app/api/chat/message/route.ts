import { NextResponse } from "next/server";
import { generateAiReply } from "@/src/lib/chat-ai";
import {
  getVisitorIdFromRequest,
  normalizeChatMessage,
  nonEmptyString,
  serializeChatMessage,
} from "@/src/lib/chat";
import { getKnowledgeContextForQuestion } from "@/src/lib/chat-knowledge";
import { cleanupExpiredChatSessionsSafely } from "@/src/lib/chat-retention";
import { getOptionalAdmin } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";
import { applyRequestRateLimit } from "@/src/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await cleanupExpiredChatSessionsSafely();

    const body = await request.json().catch(() => ({}));
    const sessionId = nonEmptyString(body.sessionId);
    const content = normalizeChatMessage(body.content);

    if (!sessionId || !content) {
      return NextResponse.json(
        { error: "sessionId and content are required" },
        { status: 400 }
      );
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "CLOSED") {
      return NextResponse.json({ error: "Session is closed" }, { status: 409 });
    }

    const visitorId = getVisitorIdFromRequest(request);
    const { admin } = await getOptionalAdmin();

    if (!admin && (!visitorId || visitorId !== session.visitorId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rateLimited = applyRequestRateLimit(request, {
      scope: admin ? "chat-message-admin" : "chat-message-visitor",
      limit: admin ? 120 : 24,
      windowMs: 60_000,
      identifier: admin ? `admin:${admin.id}` : `visitor:${visitorId || session.visitorId}`,
      message: "ส่งข้อความถี่เกินไป กรุณารอสักครู่ก่อนส่งอีกครั้ง",
    });

    if (rateLimited) {
      return rateLimited;
    }

    const senderType = admin ? "ADMIN" : "VISITOR";
    const senderAdminId = admin ? admin.id : null;

    const created = await prisma.chatMessage.create({
      data: {
        sessionId,
        senderType,
        senderAdminId,
        content,
      },
    });

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        updatedAt: new Date(),
      },
    });

    let aiMessage = null;

    if (senderType === "VISITOR" && session.status === "AI_ACTIVE") {
      const knowledge = await getKnowledgeContextForQuestion(content);

      const recentMessages = await prisma.chatMessage.findMany({
        where: {
          sessionId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      });

      const history = recentMessages.reverse();
      const aiReply = await generateAiReply({
        latestMessage: content,
        history,
        knowledgeContext: knowledge.context,
      });

      aiMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          senderType: "AI",
          content: aiReply,
        },
      });

      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(
      {
        message: serializeChatMessage(created),
        aiMessage: aiMessage ? serializeChatMessage(aiMessage) : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/chat/message failed:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
