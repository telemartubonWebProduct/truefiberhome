import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  getVisitorIdFromRequest,
  nonEmptyString,
  parseChatStatus,
  serializeChatSession,
} from "@/src/lib/chat";
import { cleanupExpiredChatSessionsSafely } from "@/src/lib/chat-retention";
import { getOptionalAdmin, requireAdmin } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: Context) {
  try {
    await cleanupExpiredChatSessionsSafely();

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Session id is required" }, { status: 400 });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const visitorId = getVisitorIdFromRequest(request);
    const { admin } = await getOptionalAdmin();

    if (!admin && (!visitorId || session.visitorId !== visitorId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(serializeChatSession(session));
  } catch (error) {
    console.error("GET /api/chat/session/[id] failed:", error);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireAdmin();
  if (auth.response) {
    return auth.response;
  }

  try {
    await cleanupExpiredChatSessionsSafely();

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Session id is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const data: Prisma.ChatSessionUncheckedUpdateInput = {};

    if ("status" in body) {
      const status = parseChatStatus(body.status);
      if (!status) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      data.status = status;
      data.closedAt = status === "CLOSED" ? new Date() : null;
    }

    if ("visitorName" in body) {
      data.visitorName = nonEmptyString(body.visitorName);
    }

    if ("assignedAdminId" in body) {
      const assignedAdminId = nonEmptyString(body.assignedAdminId);
      data.assignedAdminId = assignedAdminId;

      if (assignedAdminId) {
        data.status = "ADMIN_ACTIVE";
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const updated = await prisma.chatSession.update({
      where: { id },
      data,
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
    console.error("PATCH /api/chat/session/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    await cleanupExpiredChatSessionsSafely();

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Session id is required" }, { status: 400 });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id },
      select: {
        id: true,
        visitorId: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const visitorId = getVisitorIdFromRequest(request);
    const { admin } = await getOptionalAdmin();

    if (!admin && (!visitorId || visitorId !== session.visitorId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.chatSession.delete({
      where: { id: session.id },
    });

    return NextResponse.json({
      success: true,
      deletedSessionId: session.id,
    });
  } catch (error) {
    console.error("DELETE /api/chat/session/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
