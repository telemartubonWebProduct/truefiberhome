"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/src/lib/supabase";
import ChatBubble from "@/src/components/chat/ChatBubble";
import ChatInput from "@/src/components/chat/ChatInput";
import HandoffButton from "@/src/components/chat/HandoffButton";
import {
  CHAT_DEFAULT_GREETING,
  CHAT_SESSION_STORAGE_KEY,
  CHAT_VISITOR_STORAGE_KEY,
  type ChatMessageDto,
  type ChatSessionDto,
  type ChatStatusValue,
} from "@/src/types/chat";

function createVisitorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildMessageFromRealtimeRow(row: Record<string, unknown>): ChatMessageDto | null {
  const id = typeof row.id === "string" ? row.id : null;
  const sessionId = typeof row.session_id === "string" ? row.session_id : null;
  const senderType = typeof row.sender_type === "string" ? row.sender_type : null;
  const content = typeof row.content === "string" ? row.content : null;
  const createdAt = row.created_at;

  if (!id || !sessionId || !senderType || !content || !createdAt) {
    return null;
  }

  return {
    id,
    sessionId,
    senderType: senderType as ChatMessageDto["senderType"],
    senderAdminId: typeof row.sender_admin_id === "string" ? row.sender_admin_id : null,
    content,
    createdAt: new Date(String(createdAt)).toISOString(),
  };
}

const QUICK_ACTIONS = [
  {
    label: "แนะนำแพ็กเกจเน็ตบ้าน",
    message: "ช่วยแนะนำแพ็กเกจเน็ตบ้านที่เหมาะกับการใช้งานทั่วไปให้หน่อยครับ",
  },
  {
    label: "ดูโปรโมชันเน็ตมือถือ",
    message: "ตอนนี้มีโปรโมชันเน็ตมือถืออะไรบ้างครับ",
  },
  {
    label: "ข้อมูลบริการโซลาร์เซลล์",
    message: "ขอข้อมูลบริการโซลาร์เซลล์ W&W Energy หน่อยครับ",
  },
] as const;

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(true);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [status, setStatus] = useState<ChatStatusValue>("AI_ACTIVE");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRequestingHuman, setIsRequestingHuman] = useState(false);

  const initializedRef = useRef(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const applySession = useCallback((session: ChatSessionDto) => {
    setSessionId(session.id);
    setVisitorId(session.visitorId);
    setStatus(session.status);
    setMessages(session.messages);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, session.id);
      window.localStorage.setItem(CHAT_VISITOR_STORAGE_KEY, session.visitorId);
    }
  }, []);

  const loadSession = useCallback(
    async (targetSessionId: string, currentVisitorId: string) => {
      const response = await fetch(`/api/chat/session/${targetSessionId}`, {
        headers: {
          "x-chat-visitor-id": currentVisitorId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.status}`);
      }

      const payload = (await response.json()) as ChatSessionDto;
      applySession(payload);
      return payload;
    },
    [applySession]
  );

  const createSession = useCallback(
    async (currentVisitorId: string) => {
      const response = await fetch("/api/chat/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitorId: currentVisitorId,
          metadata: {
            pathname: typeof window !== "undefined" ? window.location.pathname : null,
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`);
      }

      const payload = (await response.json()) as ChatSessionDto;
      applySession(payload);
      return payload;
    },
    [applySession]
  );

  useEffect(() => {
    const storedVisitorId = window.localStorage.getItem(CHAT_VISITOR_STORAGE_KEY);
    const resolvedVisitorId = storedVisitorId || createVisitorId();

    if (!storedVisitorId) {
      window.localStorage.setItem(CHAT_VISITOR_STORAGE_KEY, resolvedVisitorId);
    }

    setVisitorId(resolvedVisitorId);
  }, []);

  useEffect(() => {
    if (!visitorId || initializedRef.current) {
      return;
    }

    const currentVisitorId = visitorId;

    initializedRef.current = true;
    let cancelled = false;

    async function bootstrap() {
      setIsInitializing(true);
      setError(null);

      try {
        const storedSessionId = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY);

        if (storedSessionId) {
          await loadSession(storedSessionId, currentVisitorId);
        } else {
          await createSession(currentVisitorId);
        }
      } catch (loadError) {
        console.error("Failed to bootstrap chat session", loadError);

        try {
          await createSession(currentVisitorId);
        } catch (createError) {
          console.error("Failed to recover by creating a new chat session", createError);
          if (!cancelled) {
            setError("ไม่สามารถเริ่มต้นแชทได้ กรุณาลองใหม่อีกครั้ง");
          }
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [createSession, loadSession, visitorId]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`chat-session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const nextMessage = buildMessageFromRealtimeRow(payload.new as Record<string, unknown>);
          if (!nextMessage) {
            return;
          }

          setMessages((current) => {
            if (current.some((message) => message.id === nextMessage.id)) {
              return current;
            }

            return [...current, nextMessage];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const next = payload.new as Record<string, unknown>;
          if (typeof next.status === "string") {
            setStatus(next.status as ChatStatusValue);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !visitorId || !isOpen) {
      return;
    }

    const pollIntervalMs =
      status === "WAITING_FOR_ADMIN" || status === "ADMIN_ACTIVE" ? 3000 : 10000;

    const intervalId = window.setInterval(() => {
      void loadSession(sessionId, visitorId).catch(() => {
        // Keep polling silent; realtime handles the happy path.
      });
    }, pollIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isOpen, loadSession, sessionId, status, visitorId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [isOpen, messages]);

  const statusLabel = useMemo(() => {
    if (status === "WAITING_FOR_ADMIN") {
      return "กำลังรอเจ้าหน้าที่";
    }

    if (status === "ADMIN_ACTIVE") {
      return "เจ้าหน้าที่กำลังดูแล";
    }

    if (status === "CLOSED") {
      return "แชทนี้ปิดแล้ว";
    }

    return "ผู้ช่วยออนไลน์";
  }, [status]);

  const statusClass = useMemo(() => {
    if (status === "WAITING_FOR_ADMIN") {
      return "border border-amber-200 bg-amber-50 text-amber-800";
    }

    if (status === "ADMIN_ACTIVE") {
      return "border border-emerald-200 bg-emerald-50 text-emerald-800";
    }

    if (status === "CLOSED") {
      return "border border-slate-200 bg-slate-100 text-slate-600";
    }

    return "border border-[#f4bfd0] bg-[#fff1f6] text-[#c71b49]";
  }, [status]);

  const handleSend = useCallback(async (presetMessage?: string) => {
    if (!sessionId || !visitorId || isSending) {
      return;
    }

    const content = (presetMessage ?? input).trim();
    if (!content) {
      return;
    }

    setError(null);
    setInput("");
    setIsSending(true);

    const optimisticMessage: ChatMessageDto = {
      id: `temp-${Date.now()}`,
      sessionId,
      senderType: "VISITOR",
      senderAdminId: null,
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-chat-visitor-id": visitorId,
        },
        body: JSON.stringify({
          sessionId,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Message send failed: ${response.status}`);
      }

      const payload = (await response.json()) as {
        message: ChatMessageDto;
        aiMessage: ChatMessageDto | null;
      };

      setMessages((current) => {
        const withoutOptimistic = current.filter((message) => message.id !== optimisticMessage.id);
        const next = [...withoutOptimistic, payload.message];

        if (payload.aiMessage) {
          next.push(payload.aiMessage);
        }

        return next;
      });
    } catch (sendError) {
      console.error("Failed to send message", sendError);
      setMessages((current) => current.filter((message) => message.id !== optimisticMessage.id));
      setError("ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, sessionId, visitorId]);

  const handleQuickAction = useCallback(
    (message: string) => {
      void handleSend(message);
    },
    [handleSend]
  );

  const handleHandoff = useCallback(async () => {
    if (!sessionId || !visitorId || isRequestingHuman) {
      return;
    }

    setIsRequestingHuman(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/handoff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-chat-visitor-id": visitorId,
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Handoff request failed: ${response.status}`);
      }

      await loadSession(sessionId, visitorId);
    } catch (handoffError) {
      console.error("Failed to request human handoff", handoffError);
      setError("ไม่สามารถส่งคำขอคุยกับเจ้าหน้าที่ได้");
    } finally {
      setIsRequestingHuman(false);
    }
  }, [isRequestingHuman, loadSession, sessionId, visitorId]);

  return (
    <>
      {isOpen && (
        <section
          className="fixed right-4 z-[9998] w-[min(92vw,410px)] overflow-hidden rounded-2xl border border-[#e3e8f3] bg-[#f5f6fb] shadow-[0_22px_60px_rgba(15,23,42,0.24)]"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}
          aria-label="True Fiber Home chat"
        >
          <header className="border-b border-slate-200 bg-white px-5 pb-4 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                <h2 className="text-[31px] font-semibold leading-none text-slate-900">Chatbot</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close chat"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M4.47 4.47a.75.75 0 011.06 0L10 8.94l4.47-4.47a.75.75 0 111.06 1.06L11.06 10l4.47 4.47a.75.75 0 11-1.06 1.06L10 11.06l-4.47 4.47a.75.75 0 11-1.06-1.06L8.94 10 4.47 5.53a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <p className="mt-4 text-[15px] leading-6 text-slate-700">
              อยากสมัครหรือปรึกษาแพ็กเกจไหน ทักได้เลย เดี๋ยวเราช่วยแนะนำให้ครับ
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleQuickAction(action.message)}
                  disabled={isInitializing || isSending || status === "CLOSED"}
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:border-[#f2b4c8] hover:bg-[#fff3f7] hover:text-[#c71b49] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </header>

          <div className="h-[340px] overflow-y-auto bg-[#eef1f7] px-4 py-5 sm:h-[360px]">
            <div className="space-y-4">
              {isInitializing ? (
                CHAT_DEFAULT_GREETING.map((message, index) => (
                  <div key={`placeholder-${index}`} className="max-w-[88%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 shadow-sm">
                    {message}
                  </div>
                ))
              ) : messages.length > 0 ? (
                messages.map((message) => <ChatBubble key={message.id} message={message} />)
              ) : (
                CHAT_DEFAULT_GREETING.map((message, index) => (
                  <div key={`fallback-${index}`} className="max-w-[88%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 shadow-sm">
                    {message}
                  </div>
                ))
              )}
              <div ref={messageEndRef} />
            </div>
          </div>

          <footer className="space-y-3 border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{statusLabel}</p>
              {status === "AI_ACTIVE" && (
                <HandoffButton
                  disabled={isInitializing || isSending}
                  waiting={isRequestingHuman}
                  onClick={handleHandoff}
                />
              )}
            </div>

            <ChatInput
              value={input}
              disabled={isInitializing || isSending || status === "CLOSED"}
              onChange={setInput}
              onSend={() => void handleSend()}
            />

            {error && <p className="text-xs font-medium text-red-600">{error}</p>}

            <p className="text-center text-xs text-slate-500">
              Powered by <span className="font-semibold text-[#e61c50]">True Fiber Home</span>
            </p>
          </footer>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className="fixed right-4 z-[9999] inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ef2d63] to-[#c81649] text-white shadow-2xl shadow-[#e83467]/45 transition hover:scale-[1.03]"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)" }}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7">
          {isOpen ? (
            <path
              fillRule="evenodd"
              d="M5.22 5.22a.75.75 0 011.06 0L10 8.94l3.72-3.72a.75.75 0 111.06 1.06L11.06 10l3.72 3.72a.75.75 0 11-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 11-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          ) : (
            <path
              fillRule="evenodd"
              d="M3.5 5.75A2.25 2.25 0 015.75 3.5h8.5a2.25 2.25 0 012.25 2.25v5.38a2.25 2.25 0 01-2.25 2.25H10.9l-3.2 2.67a.75.75 0 01-1.23-.58v-2.1H5.75A2.25 2.25 0 013.5 11.13V5.75zm3.75 2a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5h-5.5z"
              clipRule="evenodd"
            />
          )}
        </svg>
      </button>
    </>
  );
}
