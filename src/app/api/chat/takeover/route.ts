import { NextResponse } from "next/server";
import { nonEmptyString, serializeChatSession } from "@/src/lib/chat";
import { cleanupExpiredChatSessionsSafely } from "@/src/lib/chat-retention";
import { requireAdmin } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) {
    return auth.response;
  }

  if (!auth.admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await cleanupExpiredChatSessionsSafely();

    const body = await request.json().catch(() => ({}));
    const sessionId = nonEmptyString(body.sessionId);

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const existing = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existing.status === "CLOSED") {
      return NextResponse.json({ error: "Session is closed" }, { status: 409 });
    }

    if (
      existing.assignedAdminId &&
      existing.assignedAdminId !== auth.admin.id &&
      auth.admin.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Session already assigned to another admin" },
        { status: 409 }
      );
    }

    await prisma.chatMessage.create({
      data: {
        sessionId,
        senderType: "SYSTEM",
        content: `${auth.admin.name} joined the conversation`,
      },
    });

    const updated = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: "ADMIN_ACTIVE",
        assignedAdminId: auth.admin.id,
        updatedAt: new Date(),
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json(serializeChatSession(updated));
  } catch (error) {
    console.error("POST /api/chat/takeover failed:", error);
    return NextResponse.json({ error: "Failed to take over session" }, { status: 500 });
  }
}
