"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase";
import ChatInput from "@/src/components/chat/ChatInput";
import type { ChatMessageDto, ChatSessionDto } from "@/src/types/chat";

interface AdminChatRoomProps {
  sessionId: string;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseRealtimeMessageRow(row: Record<string, unknown>): ChatMessageDto | null {
  if (
    typeof row.id !== "string" ||
    typeof row.session_id !== "string" ||
    typeof row.sender_type !== "string" ||
    typeof row.content !== "string" ||
    typeof row.created_at !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    sessionId: row.session_id,
    senderType: row.sender_type as ChatMessageDto["senderType"],
    senderAdminId: typeof row.sender_admin_id === "string" ? row.sender_admin_id : null,
    content: row.content,
    createdAt: row.created_at,
  };
}

function playNotifyTone() {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") {
    return;
  }

  const audioCtx = new window.AudioContext();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.08;

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.12);
}

export default function AdminChatRoom({ sessionId }: AdminChatRoomProps) {
  const router = useRouter();
  const [session, setSession] = useState<ChatSessionDto | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<ChatSessionDto | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  const notifyVisitorMessage = useCallback((message: ChatMessageDto) => {
    if (notifiedIdsRef.current.has(message.id)) {
      return;
    }

    notifiedIdsRef.current.add(message.id);
    playNotifyTone();

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      document.hidden
    ) {
      new Notification("ข้อความใหม่จากลูกค้า", {
        body: message.content.slice(0, 120),
      });
    }
  }, []);

  const loadSession = useCallback(async () => {
    const response = await fetch(`/api/chat/session/${sessionId}`);

    if (!response.ok) {
      throw new Error(`Failed to load chat session: ${response.status}`);
    }

    const payload = (await response.json()) as ChatSessionDto;

    const previous = sessionRef.current;
    if (previous) {
      const knownMessageIds = new Set(previous.messages.map((message) => message.id));
      const newVisitorMessages = payload.messages
        .filter((message) => message.senderType === "VISITOR" && !knownMessageIds.has(message.id))
        .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

      for (const message of newVisitorMessages) {
        notifyVisitorMessage(message);
      }
    }

    setSession(payload);
  }, [notifyVisitorMessage, sessionId]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      setError(null);

      try {
        await loadSession();
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setError("ไม่สามารถโหลดข้อมูลแชทได้");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`admin-chat-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const parsed = parseRealtimeMessageRow(payload.new as Record<string, unknown>);
          if (!parsed) {
            return;
          }

          setSession((current) => {
            if (!current) {
              return current;
            }

            if (current.messages.some((item) => item.id === parsed.id)) {
              return current;
            }

            return {
              ...current,
              messages: [...current.messages, parsed],
              updatedAt: parsed.createdAt,
            };
          });

          if (parsed.senderType === "VISITOR") {
            notifyVisitorMessage(parsed);
          }
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
          const row = payload.new as Record<string, unknown>;
          setSession((current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              status: typeof row.status === "string" ? (row.status as ChatSessionDto["status"]) : current.status,
              assignedAdminId:
                typeof row.assigned_admin_id === "string" ? row.assigned_admin_id : current.assignedAdminId,
              updatedAt: typeof row.updated_at === "string" ? row.updated_at : current.updatedAt,
            };
          });
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          void loadSession().catch(() => {
            // Silent fallback; periodic refresh keeps data in sync.
          });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadSession, notifyVisitorMessage, sessionId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadSession().catch(() => {
        // Keep polling resilient.
      });
    }, 4000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadSession]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  const canTakeOver = useMemo(() => {
    return session?.status === "WAITING_FOR_ADMIN" || session?.status === "AI_ACTIVE";
  }, [session?.status]);

  const handleEndTask = useCallback(async () => {
    if (!session || isEnding) {
      return;
    }

    const confirmed = window.confirm("ยืนยันจบงานและลบแชทนี้ใช่ไหม?");
    if (!confirmed) {
      return;
    }

    setIsEnding(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/session/${session.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete chat session: ${response.status}`);
      }

      router.push("/dashboard/chat");
      router.refresh();
    } catch (endError) {
      console.error(endError);
      setError("ไม่สามารถจบงานและลบแชทได้");
    } finally {
      setIsEnding(false);
    }
  }, [isEnding, router, session]);

  const handleTakeOver = useCallback(async () => {
    if (!session || isTakingOver || isEnding) {
      return;
    }

    setIsTakingOver(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/takeover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: session.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to take over: ${response.status}`);
      }

      await loadSession();
    } catch (takeoverError) {
      console.error(takeoverError);
      setError("ไม่สามารถรับช่วงแชทได้");
    } finally {
      setIsTakingOver(false);
    }
  }, [isEnding, isTakingOver, loadSession, session]);

  const handleSend = useCallback(async () => {
    if (!session || isSending || isEnding) {
      return;
    }

    const content = input.trim();
    if (!content) {
      return;
    }

    setInput("");
    setIsSending(true);
    setError(null);

    const optimisticMessage: ChatMessageDto = {
      id: `temp-${Date.now()}`,
      sessionId: session.id,
      senderType: "ADMIN",
      senderAdminId: null,
      content,
      createdAt: new Date().toISOString(),
    };

    setSession((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        messages: [...current.messages, optimisticMessage],
      };
    });

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: session.id,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send admin message: ${response.status}`);
      }

      const payload = (await response.json()) as {
        message: ChatMessageDto;
        aiMessage: ChatMessageDto | null;
      };

      setSession((current) => {
        if (!current) {
          return current;
        }

        const withoutOptimistic = current.messages.filter((message) => message.id !== optimisticMessage.id);
        const nextMessages = [...withoutOptimistic];

        if (!nextMessages.some((message) => message.id === payload.message.id)) {
          nextMessages.push(payload.message);
        }

        if (payload.aiMessage && !nextMessages.some((message) => message.id === payload.aiMessage?.id)) {
          nextMessages.push(payload.aiMessage);
        }

        return {
          ...current,
          messages: nextMessages,
        };
      });
    } catch (sendError) {
      console.error(sendError);
      setError("ไม่สามารถส่งข้อความได้");
      setSession((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          messages: current.messages.filter((message) => message.id !== optimisticMessage.id),
        };
      });
    } finally {
      setIsSending(false);
    }
  }, [input, isEnding, isSending, loadSession, session]);

  if (isLoading) {
    return <div className="text-sm text-gray-400">Loading chat session...</div>;
  }

  if (!session) {
    return <div className="text-sm text-red-400">Chat session not found.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-white">Session {session.id}</h1>
          <p className="text-sm text-gray-400">Visitor: {session.visitorName || session.visitorId}</p>
          <p className="text-xs text-gray-500">Status: {session.status}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canTakeOver && (
          <button
            type="button"
            onClick={handleTakeOver}
            disabled={isTakingOver || isEnding}
            className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-gray-600"
          >
            {isTakingOver ? "Taking over..." : "Take Over"}
          </button>
          )}

          <button
            type="button"
            onClick={handleEndTask}
            disabled={isEnding || isTakingOver || isSending}
            className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-gray-600"
          >
            {isEnding ? "Ending..." : "End Task"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/60">
        <div className="max-h-[58vh] min-h-[45vh] space-y-3 overflow-y-auto p-5">
          {session.messages.map((message) => {
            const isAdmin = message.senderType === "ADMIN";
            const isVisitor = message.senderType === "VISITOR";

            return (
              <div key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    isAdmin
                      ? "bg-red-500 text-white"
                      : isVisitor
                        ? "bg-gray-700 text-gray-100"
                        : "bg-gray-800 text-gray-300"
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`mt-1 text-[10px] ${isAdmin ? "text-red-100" : "text-gray-400"}`}>
                    {message.senderType} • {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="space-y-3 border-t border-gray-800 p-4">
          <ChatInput
            value={input}
            disabled={isSending || isEnding || session.status === "CLOSED"}
            onChange={setInput}
            onSend={handleSend}
          />

          {error && <p className="text-xs font-medium text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
