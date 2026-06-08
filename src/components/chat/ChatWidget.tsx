"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createClient } from "@/src/lib/supabase";
import ChatBubble, {
  type PromotionFlexType,
} from "@/src/components/chat/ChatBubble";
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
import { trackChatOpen, trackChatSendMessage, trackChatQuickAction, trackChatHandoff } from "@/src/lib/track-event";

function createVisitorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildMessageFromRealtimeRow(
  row: Record<string, unknown>,
): ChatMessageDto | null {
  const id = typeof row.id === "string" ? row.id : null;
  const sessionId = typeof row.session_id === "string" ? row.session_id : null;
  const senderType =
    typeof row.sender_type === "string" ? row.sender_type : null;
  const content = typeof row.content === "string" ? row.content : null;
  const createdAt = row.created_at;

  if (!id || !sessionId || !senderType || !content || !createdAt) {
    return null;
  }

  return {
    id,
    sessionId,
    senderType: senderType as ChatMessageDto["senderType"],
    senderAdminId:
      typeof row.sender_admin_id === "string" ? row.sender_admin_id : null,
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

const PROMOTION_QUERY_REGEX =
  /(โปร|โปรโมชั่น|โปรโมชัน|promotion|promo|แพ็กเกจ|package)/i;
const HOME_PROMOTION_REGEX = /(เน็ตบ้าน|บ้าน|ไฟเบอร์|fiber|wifi|broadband)/i;
const MOBILE_PROMOTION_REGEX = /(มือถือ|mobile|5g|4g|ซิม|รายเดือน|เติมเงิน)/i;

function classifyPromotionFlexType(content: string): PromotionFlexType {
  if (HOME_PROMOTION_REGEX.test(content)) {
    return "home";
  }

  if (MOBILE_PROMOTION_REGEX.test(content)) {
    return "mobile";
  }

  return "mixed";
}

function getPromotionFlexTypeForMessage(
  messages: ChatMessageDto[],
  messageIndex: number,
): PromotionFlexType | null {
  const currentMessage = messages[messageIndex];
  if (!currentMessage) {
    return null;
  }

  const isSupportReply =
    currentMessage.senderType === "AI" || currentMessage.senderType === "ADMIN";
  if (!isSupportReply) {
    return null;
  }

  let visitorQuestion: ChatMessageDto | null = null;

  for (let index = messageIndex - 1; index >= 0; index -= 1) {
    const previousMessage = messages[index];

    if (previousMessage.senderType === "VISITOR") {
      visitorQuestion = previousMessage;
      break;
    }

    if (
      previousMessage.senderType === "AI" ||
      previousMessage.senderType === "ADMIN"
    ) {
      return null;
    }
  }

  if (visitorQuestion && PROMOTION_QUERY_REGEX.test(visitorQuestion.content)) {
    return classifyPromotionFlexType(visitorQuestion.content);
  }

  if (PROMOTION_QUERY_REGEX.test(currentMessage.content)) {
    return classifyPromotionFlexType(currentMessage.content);
  }

  return null;
}

function isRecoverableSessionStatus(status: number) {
  return status === 403 || status === 404;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [visualViewportHeight, setVisualViewportHeight] = useState<
    number | null
  >(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [status, setStatus] = useState<ChatStatusValue>("AI_ACTIVE");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRequestingHuman, setIsRequestingHuman] = useState(false);
  const [waiting, setWaiting] = useState(false);

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

      if (isRecoverableSessionStatus(response.status)) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
        }

        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.status}`);
      }

      const payload = (await response.json()) as ChatSessionDto;
      applySession(payload);
      return payload;
    },
    [applySession],
  );

  const createSession = useCallback(
    async (currentVisitorId: string) => {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitorId: currentVisitorId,
          metadata: {
            pathname:
              typeof window !== "undefined" ? window.location.pathname : null,
            userAgent:
              typeof navigator !== "undefined" ? navigator.userAgent : null,
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
    [applySession],
  );

  useEffect(() => {
    const viewport = window.visualViewport;

    const syncViewportState = () => {
      const width = viewport?.width ?? window.innerWidth;
      const layoutHeight = window.innerHeight;
      const visibleHeight = viewport?.height ?? layoutHeight;
      const nextIsMobile = width < 1024;
      const nextKeyboardOpen =
        nextIsMobile && visibleHeight < layoutHeight * 0.8;

      setIsMobileViewport(nextIsMobile);
      setIsKeyboardOpen(nextKeyboardOpen);
      setVisualViewportHeight(Math.round(visibleHeight));
    };

    syncViewportState();
    window.addEventListener("resize", syncViewportState);
    viewport?.addEventListener("resize", syncViewportState);
    viewport?.addEventListener("scroll", syncViewportState);

    return () => {
      window.removeEventListener("resize", syncViewportState);
      viewport?.removeEventListener("resize", syncViewportState);
      viewport?.removeEventListener("scroll", syncViewportState);
    };
  }, []);

  useEffect(() => {
    const storedVisitorId = window.localStorage.getItem(
      CHAT_VISITOR_STORAGE_KEY,
    );
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
        const storedSessionId = window.localStorage.getItem(
          CHAT_SESSION_STORAGE_KEY,
        );

        if (storedSessionId) {
          const restoredSession = await loadSession(
            storedSessionId,
            currentVisitorId,
          );

          if (!restoredSession) {
            await createSession(currentVisitorId);
          }
        } else {
          await createSession(currentVisitorId);
        }
      } catch (loadError) {
        console.error("Failed to bootstrap chat session", loadError);

        try {
          await createSession(currentVisitorId);
        } catch (createError) {
          console.error(
            "Failed to recover by creating a new chat session",
            createError,
          );
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
          const nextMessage = buildMessageFromRealtimeRow(
            payload.new as Record<string, unknown>,
          );
          if (!nextMessage) {
            return;
          }

          setMessages((current) => {
            if (current.some((message) => message.id === nextMessage.id)) {
              return current;
            }

            return [...current, nextMessage];
          });
        },
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
        },
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
      status === "WAITING_FOR_ADMIN" || status === "ADMIN_ACTIVE"
        ? 3000
        : 10000;

    const intervalId = window.setInterval(() => {
      void loadSession(sessionId, visitorId)
        .then((loadedSession) => {
          if (!loadedSession) {
            void createSession(visitorId).catch(() => {
              // Keep polling resilient; the next cycle will retry recovery.
            });
          }
        })
        .catch(() => {
          // Keep polling silent; realtime handles the happy path.
        });
    }, pollIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [createSession, isOpen, loadSession, sessionId, status, visitorId]);

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

  const handleSend = useCallback(
    async (presetMessage?: string) => {
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
      trackChatSendMessage();

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

        if (isRecoverableSessionStatus(response.status)) {
          setMessages((current) =>
            current.filter((message) => message.id !== optimisticMessage.id),
          );
          await createSession(visitorId);
          setError(
            "แชทเดิมหมดอายุแล้ว ระบบเริ่มห้องใหม่ให้แล้ว กรุณาส่งข้อความอีกครั้ง",
          );
          return;
        }

        if (!response.ok) {
          throw new Error(`Message send failed: ${response.status}`);
        }

        const payload = (await response.json()) as {
          message: ChatMessageDto;
          aiMessage: ChatMessageDto | null;
        };

        setMessages((current) => {
          const withoutOptimistic = current.filter(
            (message) => message.id !== optimisticMessage.id,
          );
          const next = [...withoutOptimistic, payload.message];

          if (payload.aiMessage) {
            next.push(payload.aiMessage);
          }

          return next;
        });
      } catch (sendError) {
        console.error("Failed to send message", sendError);
        setMessages((current) =>
          current.filter((message) => message.id !== optimisticMessage.id),
        );
        setError("ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setIsSending(false);
      }
    },
    [createSession, input, isSending, sessionId, visitorId],
  );

    const handleQuickAction = useCallback(
    (message: string, label: string) => {
      trackChatQuickAction(label);
      void handleSend(message);
    },
    [handleSend],
  );

  const handleHandoff = useCallback(async () => {
    if (!sessionId || !visitorId || isRequestingHuman) {
      return;
    }
    setWaiting(true);
    setIsRequestingHuman(true);
    setError(null);
    trackChatHandoff();

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
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: [
            "🔔 มีลูกค้าขอเจ้าหน้าที่ดูแล!",
            `🕐 เวลา: ${new Date().toLocaleString("th-TH")}`,
            "กรุณาตรวจสอบและติดต่อกลับลูกค้าโดยเร็วที่สุดด้วยครับ!",
            "www.truefiberhome.com/dashboard/chat",
          ].join("\n"),
        }),
      });
     
      if (isRecoverableSessionStatus(response.status)) {
        await createSession(visitorId);
        setError("แชทเดิมหมดอายุแล้ว ระบบเริ่มห้องใหม่ให้แล้ว");
        return;
      }

      if (!response.ok) {
        throw new Error(`Handoff request failed: ${response.status}`);
      }

      const loadedSession = await loadSession(sessionId, visitorId);
      if (!loadedSession) {
        await createSession(visitorId);
        setError("แชทเดิมหมดอายุแล้ว ระบบเริ่มห้องใหม่ให้แล้ว");
      }
    } catch (handoffError) {
      console.error("Failed to request human handoff", handoffError);
      setError("ไม่สามารถส่งคำขอคุยกับเจ้าหน้าที่ได้");
    } finally {
      setIsRequestingHuman(false);
    }
  }, [createSession, isRequestingHuman, loadSession, sessionId, visitorId]);

  const chatPanelStyle = useMemo<CSSProperties>(() => {
    const nextStyle: CSSProperties = {};

    if (isMobileViewport && isKeyboardOpen) {
      nextStyle.bottom = "max(8px, env(safe-area-inset-bottom, 0px))";
    }

    if (isMobileViewport && visualViewportHeight) {
      const reservedTop = 12;
      const reservedBottom = isKeyboardOpen ? 8 : 92;
      const minimumHeight = isKeyboardOpen ? 180 : 290;
      const nextHeight = Math.max(
        minimumHeight,
        Math.min(
          700,
          Math.floor(visualViewportHeight - reservedTop - reservedBottom),
        ),
      );

      nextStyle.height = `${nextHeight}px`;
      nextStyle.maxHeight = `${nextHeight}px`;
    }

    return nextStyle;
  }, [isKeyboardOpen, isMobileViewport, visualViewportHeight]);

  const hideFloatingToggle = isOpen || (isMobileViewport && isKeyboardOpen);
  const compactMobileLayout = isMobileViewport && isKeyboardOpen;
  const shouldShowHeaderIntro = !compactMobileLayout && messages.length < 2;
  const shouldShowQuickActions = shouldShowHeaderIntro;
  const headerClassName = shouldShowHeaderIntro
    ? "border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3 lg:px-4"
    : "border-b border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-2.5 lg:px-4";

  return (
    <>
      {isOpen && (
        <section
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+86px)] right-2 z-[9998] flex h-[min(82vh,680px)] w-[min(95vw,420px)] flex-col overflow-hidden rounded-2xl border border-[#e3e8f3] bg-[#f5f6fb] shadow-[0_22px_60px_rgba(15,23,42,0.24)] sm:bottom-[calc(env(safe-area-inset-bottom,0px)+88px)] sm:right-4 sm:w-[min(92vw,430px)] lg:bottom-[calc(env(safe-area-inset-bottom,0px)+18px)] lg:right-5 lg:w-[min(90vw,440px)]"
          style={chatPanelStyle}
          aria-label="True Fiber Home chat"
        >
          <header className={headerClassName}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"
                  aria-hidden
                />
                <h2 className="text-[21px] font-semibold leading-none text-slate-900 sm:text-[24px]">
                  Chatbot
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close chat"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.47 4.47a.75.75 0 011.06 0L10 8.94l4.47-4.47a.75.75 0 111.06 1.06L11.06 10l4.47 4.47a.75.75 0 11-1.06 1.06L10 11.06l-4.47 4.47a.75.75 0 11-1.06-1.06L8.94 10 4.47 5.53a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {shouldShowHeaderIntro && (
              <p className="mt-1 text-[12px] leading-5 text-slate-600 sm:text-[13px]">
                ถามหาโปรหรือแพ็กเกจได้เลย เดี๋ยวเราช่วยสรุปให้แบบเข้าใจง่าย
              </p>
            )}

            {shouldShowQuickActions && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 sm:gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleQuickAction(action.message, action.label)}
                    disabled={
                      isInitializing || isSending || status === "CLOSED"
                    }
                    className="inline-flex shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-[#f2b4c8] hover:bg-[#fff3f7] hover:text-[#c71b49] disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-1.5 sm:text-xs"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[#eef1f7] px-3 py-4 sm:px-4 sm:py-5">
            <div className="space-y-4">
              {isInitializing
                ? CHAT_DEFAULT_GREETING.map((message, index) => (
                    <div
                      key={`placeholder-${index}`}
                      className="max-w-[88%] rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm sm:px-4 sm:py-3 sm:text-[15px]"
                    >
                      {message}
                    </div>
                  ))
                : messages.length > 0
                  ? messages.map((message, index) => (
                      <ChatBubble
                        key={message.id}
                        message={message}
                        promotionFlexType={getPromotionFlexTypeForMessage(
                          messages,
                          index,
                        )}
                      />
                    ))
                  : CHAT_DEFAULT_GREETING.map((message, index) => (
                      <div
                        key={`fallback-${index}`}
                        className="max-w-[88%] rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm sm:px-4 sm:py-3 sm:text-[15px]"
                      >
                        {message}
                      </div>
                    ))}
              <div ref={messageEndRef} />
            </div>
          </div>

          <footer className="space-y-2 border-t border-slate-200 bg-white px-3 py-2 sm:space-y-2.5 sm:px-4 sm:py-2.5">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <p
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
              >
                {statusLabel}
              </p>
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

            {error && (
              <p className="text-xs font-medium text-red-600">{error}</p>
            )}

            {!compactMobileLayout && (
              <>
                <p className="text-center text-[11px] text-slate-500 sm:text-xs">
                  Powered by{" "}
                  <span className="font-semibold text-[#e61c50]">
                    True Fiber Home
                  </span>
                </p>
                <p className="text-center text-[11px] text-slate-500 sm:text-xs">
                  ***ระบบChatAiอาจมีข้อผิดพลาดในการให้บริการแก่ท่าน
                  กรุณาติดต่อเจ้าหน้าที่ดูแลเมื่อท่านพบปัญหา***
                </p>
              </>
            )}
          </footer>
        </section>
      )}

      <button
        type="button"
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);
          if (nextOpen) trackChatOpen();
        }}
        aria-label={isOpen ? "ปิดหน้าต่างติดต่อทีมงาน" : "ติดต่อทีมงาน"}
        className={`group fixed bottom-[calc(env(safe-area-inset-bottom,0px)+96px)] right-3 z-[9999] inline-flex items-center justify-center rounded-full text-white transition-all duration-300 sm:bottom-[calc(env(safe-area-inset-bottom,0px)+86px)] sm:right-4 lg:bottom-[calc(env(safe-area-inset-bottom,0px)+18px)] ${
          isOpen
            ? "h-12 w-12 bg-[#e61c50] ring-4 ring-white/90 shadow-2xl shadow-[#e61c50]/50 hover:scale-105 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
            : "h-12 gap-2.5 bg-gradient-to-r from-[#ef2d63] to-[#c81649] pl-1.5 pr-4 shadow-[0_8px_30px_rgba(230,28,80,0.35)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(230,28,80,0.5)] sm:h-14 sm:pl-2 sm:pr-5 lg:h-16 lg:pl-2.5 lg:pr-6"
        } ${hideFloatingToggle ? "pointer-events-none translate-y-4 opacity-0" : "opacity-100"}`}
      >
        {isOpen ? (
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90 sm:h-7 sm:w-7 lg:h-8 lg:w-8"
          >
            <path
              fillRule="evenodd"
              d="M5.22 5.22a.75.75 0 011.06 0L10 8.94l3.72-3.72a.75.75 0 111.06 1.06L11.06 10l3.72 3.72a.75.75 0 11-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 11-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <>
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#e61c50] shadow-sm transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10 lg:h-11 lg:w-11">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6"
              >
                <path
                  fillRule="evenodd"
                  d="M3.5 5.75A2.25 2.25 0 015.75 3.5h8.5a2.25 2.25 0 012.25 2.25v5.38a2.25 2.25 0 01-2.25 2.25H10.9l-3.2 2.67a.75.75 0 01-1.23-.58v-2.1H5.75A2.25 2.25 0 013.5 11.13V5.75zm3.75 2a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5h-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 sm:h-4 sm:w-4"></span>
              </span>
            </div>
            <span className="text-[12px] font-semibold tracking-wide sm:text-[13px] lg:text-[14px]">
              ติดต่อทีมงาน
            </span>
          </>
        )}
      </button>
    </>
  );
}
