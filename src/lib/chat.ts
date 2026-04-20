import { ChatStatus, type ChatMessage, type ChatSession } from "@prisma/client";
import {
  CHAT_STATUS_VALUES,
  type ChatMessageDto,
  type ChatSessionDto,
  type ChatSessionSummaryDto,
} from "@/src/types/chat";

const MAX_CHAT_MESSAGE_LENGTH = 1200;
const MAX_VISITOR_ID_LENGTH = 128;

export function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeVisitorId(value: unknown): string | null {
  const visitorId = nonEmptyString(value);
  if (!visitorId) {
    return null;
  }

  return visitorId.slice(0, MAX_VISITOR_ID_LENGTH);
}

export function getVisitorIdFromRequest(request: Request): string | null {
  return normalizeVisitorId(request.headers.get("x-chat-visitor-id"));
}

export function normalizeChatMessage(value: unknown): string | null {
  const text = nonEmptyString(value);
  if (!text) {
    return null;
  }

  return text.slice(0, MAX_CHAT_MESSAGE_LENGTH);
}

export function normalizeJsonRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function parseChatStatus(value: unknown): ChatStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  if (!CHAT_STATUS_VALUES.includes(value as (typeof CHAT_STATUS_VALUES)[number])) {
    return null;
  }

  return value as ChatStatus;
}

export function serializeChatMessage(message: ChatMessage): ChatMessageDto {
  return {
    id: message.id,
    sessionId: message.sessionId,
    senderType: message.senderType,
    senderAdminId: message.senderAdminId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}

type SessionWithMessages = ChatSession & { messages: ChatMessage[] };

export function serializeChatSession(session: SessionWithMessages): ChatSessionDto {
  return {
    id: session.id,
    visitorId: session.visitorId,
    visitorName: session.visitorName,
    status: session.status,
    assignedAdminId: session.assignedAdminId,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    closedAt: session.closedAt ? session.closedAt.toISOString() : null,
    messages: session.messages.map(serializeChatMessage),
  };
}

type SessionSummaryInput = ChatSession & {
  messages: ChatMessage[];
  _count: {
    messages: number;
  };
};

export function serializeChatSessionSummary(session: SessionSummaryInput): ChatSessionSummaryDto {
  const lastMessage = session.messages.length > 0 ? serializeChatMessage(session.messages[0]) : null;

  return {
    id: session.id,
    visitorId: session.visitorId,
    visitorName: session.visitorName,
    status: session.status,
    assignedAdminId: session.assignedAdminId,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    lastMessage,
    messageCount: session._count.messages,
  };
}

export function isChatClosed(status: ChatStatus) {
  return status === "CLOSED";
}
