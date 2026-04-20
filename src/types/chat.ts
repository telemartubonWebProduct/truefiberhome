export const CHAT_STATUS_VALUES = [
  "AI_ACTIVE",
  "WAITING_FOR_ADMIN",
  "ADMIN_ACTIVE",
  "CLOSED",
] as const;

export type ChatStatusValue = (typeof CHAT_STATUS_VALUES)[number];

export const CHAT_SENDER_VALUES = ["VISITOR", "AI", "ADMIN", "SYSTEM"] as const;

export type ChatSenderType = (typeof CHAT_SENDER_VALUES)[number];

export interface ChatMessageDto {
  id: string;
  sessionId: string;
  senderType: ChatSenderType;
  senderAdminId: string | null;
  content: string;
  createdAt: string;
}

export interface ChatSessionDto {
  id: string;
  visitorId: string;
  visitorName: string | null;
  status: ChatStatusValue;
  assignedAdminId: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  messages: ChatMessageDto[];
}

export interface ChatSessionSummaryDto {
  id: string;
  visitorId: string;
  visitorName: string | null;
  status: ChatStatusValue;
  assignedAdminId: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessage: ChatMessageDto | null;
  messageCount: number;
}

export const CHAT_VISITOR_STORAGE_KEY = "tfh_chat_visitor_id";
export const CHAT_SESSION_STORAGE_KEY = "tfh_chat_session_id";

export const CHAT_DEFAULT_GREETING: readonly string[] = [
  "สวัสดีครับ! 👋",
  "เริ่มต้นการสนทนาได้เลยครับ เราพร้อมช่วยเหลือคุณตลอด 24 ชั่วโมงครับ",
];
