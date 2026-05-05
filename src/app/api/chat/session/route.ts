import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { CHAT_DEFAULT_GREETING, CHAT_STATUS_VALUES } from "@/src/types/chat";
import {
  nonEmptyString,
  normalizeJsonRecord,
  normalizeVisitorId,
  serializeChatSession,
  serializeChatSessionSummary,
} from "@/src/lib/chat";
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
    const takeParam = searchParams.get("take");

    const statuses = (statusParam || "")
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is (typeof CHAT_STATUS_VALUES)[number] =>
        CHAT_STATUS_VALUES.includes(value as (typeof CHAT_STATUS_VALUES)[number])
      );

    const take = Number.parseInt(takeParam || "", 10);

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
                in: ["WAITING_FOR_ADMIN", "ADMIN_ACTIVE", "AI_ACTIVE"],
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
      take: Number.isFinite(take) && take > 0 ? Math.min(take, 200) : 100,
    });

    return NextResponse.json(sessions.map(serializeChatSessionSummary));
  } catch (error) {
    console.error("GET /api/chat/session failed:", error);
    return NextResponse.json({ error: "Failed to load chat sessions" }, { status: 500 });
  }
}
