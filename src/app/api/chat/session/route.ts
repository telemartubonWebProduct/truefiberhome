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
import { applyRequestRateLimit } from "@/src/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await cleanupExpiredChatSessionsSafely();

    const body = await request.json().catch(() => ({}));
    const requestedVisitorId = normalizeVisitorId(body.visitorId);
    const rateLimited = applyRequestRateLimit(request, {
      scope: "chat-session-create",
      limit: 6,
      windowMs: 5 * 60_000,
      identifier: requestedVisitorId ? `visitor:${requestedVisitorId}` : null,
      message: "สร้างห้องแชทถี่เกินไป กรุณาลองใหม่อีกครั้งภายหลัง",
    });

    if (rateLimited) {
      return rateLimited;
    }

    const visitorId = requestedVisitorId || crypto.randomUUID();
    const visitorName = nonEmptyString(body.visitorName);
    const metadata = normalizeJsonRecord(body.metadata);

    const session = await prisma.chatSession.create({
      data: {
        visitorId,
        visitorName,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
        messages: {
          create: CHAT_DEFAULT_GREETING.map((content) => ({
            senderType: "AI",
            content,
          })),
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json(serializeChatSession(session), { status: 201 });
  } catch (error) {
    console.error("POST /api/chat/session failed:", error);
    return NextResponse.json({ error: "Failed to create chat session" }, { status: 500 });
  }
}

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
