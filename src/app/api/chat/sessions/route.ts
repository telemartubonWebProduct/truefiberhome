import { NextResponse } from "next/server";
import { CHAT_STATUS_VALUES } from "@/src/types/chat";
import { serializeChatSessionSummary } from "@/src/lib/chat";
import { cleanupExpiredChatSessionsSafely } from "@/src/lib/chat-retention";
import { requireAdmin } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) {
    return auth.response;
  }

  try {
    await cleanupExpiredChatSessionsSafely();

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const statuses = (statusParam || "")
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is (typeof CHAT_STATUS_VALUES)[number] =>
        CHAT_STATUS_VALUES.includes(value as (typeof CHAT_STATUS_VALUES)[number])
      );

    const sessions = await prisma.chatSession.findMany({
      where:
        statuses.length > 0
          ? {
              status: {
                in: statuses,
              },
            }
          : {
              status: {
                in: ["WAITING_FOR_ADMIN", "ADMIN_ACTIVE"],
              },
            },
      include: {
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json(sessions.map(serializeChatSessionSummary));
  } catch (error) {
    console.error("GET /api/chat/sessions failed:", error);
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }
}
