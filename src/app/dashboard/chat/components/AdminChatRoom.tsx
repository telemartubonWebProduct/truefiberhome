"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase";
import ChatInput from "@/src/components/chat/ChatInput";
import type {
  ChatMessageDto,
  ChatSessionDto,
  ChatSessionSummaryDto,
  ChatStatusValue,
} from "@/src/types/chat";

interface AdminChatRoomProps {
  sessionId: string;
}

type QueueFilterValue = "ALL" | ChatStatusValue;

const QUEUE_FILTERS: Array<{ value: QueueFilterValue; label: string }> = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "WAITING_FOR_ADMIN", label: "รอเจ้าหน้าที่" },
  { value: "ADMIN_ACTIVE", label: "เจ้าหน้าที่ดูแล" },
  { value: "AI_ACTIVE", label: "AI ดูแล" },
  { value: "CLOSED", label: "ปิดแล้ว" },
];

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatQueueName(name: string | null, visitorId: string) {
  if (name && name.trim().length > 0) {
    return name.trim();
  }

  return `ผู้เยี่ยมชม ${visitorId.slice(0, 8)}`;
}

function toPreviewText(content: string | null | undefined) {
  if (!content || content.trim().length === 0) {
    return "ยังไม่มีข้อความในห้องนี้";
  }

  const compact = content.replace(/\s+/g, " ").trim();
  return compact.length > 70 ? `${compact.slice(0, 69)}…` : compact;
}

function getSenderLabel(senderType: ChatMessageDto["senderType"]) {
  if (senderType === "VISITOR") {
    return "ลูกค้า";
  }

  if (senderType === "ADMIN") {
    return "เจ้าหน้าที่";
  }

  if (senderType === "AI") {
    return "AI";
  }

  return "ระบบ";
}

function getStatusLabel(status: ChatStatusValue) {
  if (status === "WAITING_FOR_ADMIN") {
    return "รอเจ้าหน้าที่";
  }

  if (status === "ADMIN_ACTIVE") {
    return "เจ้าหน้าที่กำลังดูแล";
  }

  if (status === "AI_ACTIVE") {
    return "AI กำลังตอบ";
  }

  return "ปิดห้องแล้ว";
}

function getStatusChipClass(status: ChatStatusValue) {
  if (status === "WAITING_FOR_ADMIN") {
    return "border-amber-500/35 bg-amber-500/10 text-amber-200";
  }

  if (status === "ADMIN_ACTIVE") {
    return "border-emerald-500/35 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "AI_ACTIVE") {
    return "border-sky-500/35 bg-sky-500/10 text-sky-200";
  }

  return "border-gray-700 bg-gray-800 text-gray-300";
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

function sortQueue(list: ChatSessionSummaryDto[]) {
  return list
    .slice()
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

function buildSessionSummary(session: ChatSessionDto): ChatSessionSummaryDto {
  const lastMessage =
    session.messages.length > 0 ? session.messages[session.messages.length - 1] : null;

  return {
    id: session.id,
    visitorId: session.visitorId,
    visitorName: session.visitorName,
    status: session.status,
    assignedAdminId: session.assignedAdminId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    lastMessage,
    messageCount: session.messages.length,
  };
}

function upsertQueueSummary(
  queue: ChatSessionSummaryDto[],
  summary: ChatSessionSummaryDto
): ChatSessionSummaryDto[] {
  const index = queue.findIndex((item) => item.id === summary.id);

  if (index < 0) {
    return sortQueue([summary, ...queue]);
  }

  const next = queue.slice();
  next[index] = summary;
  return sortQueue(next);
}

export default function AdminChatRoom({ sessionId }: AdminChatRoomProps) {
  const router = useRouter();

  const [queue, setQueue] = useState<ChatSessionSummaryDto[]>([]);
  const [queueFilter, setQueueFilter] = useState<QueueFilterValue>("ALL");
  const [query, setQuery] = useState("");

  const [session, setSession] = useState<ChatSessionDto | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isQueueLoading, setIsQueueLoading] = useState(true);
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

  const loadQueue = useCallback(async () => {
    const response = await fetch(
      "/api/chat/session?status=WAITING_FOR_ADMIN,ADMIN_ACTIVE,AI_ACTIVE,CLOSED&take=200",
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`โหลดคิวแชทไม่สำเร็จ: ${response.status}`);
    }

    const payload = (await response.json()) as ChatSessionSummaryDto[];
    setQueue(sortQueue(payload));
  }, []);

  const loadSession = useCallback(async () => {
    const response = await fetch(`/api/chat/session/${sessionId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`โหลดห้องแชทไม่สำเร็จ: ${response.status}`);
    }

    const payload = (await response.json()) as ChatSessionDto;

    const previous = sessionRef.current;
    if (previous) {
      const knownMessageIds = new Set(previous.messages.map((message) => message.id));
      const newVisitorMessages = payload.messages
        .filter((message) => message.senderType === "VISITOR" && !knownMessageIds.has(message.id))
        .sort(
          (left, right) =>
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        );

      for (const message of newVisitorMessages) {
        notifyVisitorMessage(message);
      }
    }

    setSession(payload);
    setQueue((current) => upsertQueueSummary(current, buildSessionSummary(payload)));
  }, [notifyVisitorMessage, sessionId]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      setIsQueueLoading(true);
      setError(null);

      try {
        await Promise.all([loadQueue(), loadSession()]);
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setError("ไม่สามารถโหลดข้อมูลแชทได้");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsQueueLoading(false);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [loadQueue, loadSession]);

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

          setQueue((current) => {
            const existing = current.find((item) => item.id === parsed.sessionId);
            if (!existing) {
              return current;
            }

            const nextSummary: ChatSessionSummaryDto = {
              ...existing,
              updatedAt: parsed.createdAt,
              lastMessage: parsed,
              messageCount: existing.messageCount + 1,
            };

            return upsertQueueSummary(current, nextSummary);
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

          const nextStatus =
            typeof row.status === "string"
              ? (row.status as ChatSessionDto["status"])
              : null;
          const nextAssignedAdminId =
            row.assigned_admin_id === null || typeof row.assigned_admin_id === "string"
              ? (row.assigned_admin_id as string | null)
              : null;
          const nextUpdatedAt = typeof row.updated_at === "string" ? row.updated_at : null;

          setSession((current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              status: nextStatus || current.status,
              assignedAdminId:
                nextAssignedAdminId !== null
                  ? nextAssignedAdminId
                  : row.assigned_admin_id === null
                    ? null
                    : current.assignedAdminId,
              updatedAt: nextUpdatedAt || current.updatedAt,
            };
          });

          setQueue((current) => {
            const existing = current.find((item) => item.id === sessionId);
            if (!existing) {
              return current;
            }

            const nextSummary: ChatSessionSummaryDto = {
              ...existing,
              status: nextStatus || existing.status,
              assignedAdminId:
                nextAssignedAdminId !== null
                  ? nextAssignedAdminId
                  : row.assigned_admin_id === null
                    ? null
                    : existing.assignedAdminId,
              updatedAt: nextUpdatedAt || existing.updatedAt,
            };

            return upsertQueueSummary(current, nextSummary);
          });
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          void Promise.all([loadSession(), loadQueue()]).catch(() => {
            // Silent fallback; polling keeps data in sync.
          });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadQueue, loadSession, notifyVisitorMessage, sessionId]);

  useEffect(() => {
    const queueInterval = window.setInterval(() => {
      void loadQueue().catch(() => {
        // Keep polling resilient.
      });
    }, 7000);

    return () => {
      window.clearInterval(queueInterval);
    };
  }, [loadQueue]);

  useEffect(() => {
    const sessionInterval = window.setInterval(() => {
      void loadSession().catch(() => {
        // Keep polling resilient.
      });
    }, 4500);

    return () => {
      window.clearInterval(sessionInterval);
    };
  }, [loadSession]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages.length]);

  const queueCounts = useMemo(() => {
    const waiting = queue.filter((item) => item.status === "WAITING_FOR_ADMIN").length;
    const adminActive = queue.filter((item) => item.status === "ADMIN_ACTIVE").length;
    const aiActive = queue.filter((item) => item.status === "AI_ACTIVE").length;
    const closed = queue.filter((item) => item.status === "CLOSED").length;

    return {
      total: queue.length,
      waiting,
      adminActive,
      aiActive,
      closed,
    };
  }, [queue]);

  const filteredQueue = useMemo(() => {
    let next = queue;

    if (queueFilter !== "ALL") {
      next = next.filter((item) => item.status === queueFilter);
    }

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return next;
    }

    return next.filter((item) => {
      const displayName = formatQueueName(item.visitorName, item.visitorId).toLowerCase();
      const visitorId = item.visitorId.toLowerCase();
      const lastMessage = (item.lastMessage?.content || "").toLowerCase();

      return (
        displayName.includes(normalizedQuery) ||
        visitorId.includes(normalizedQuery) ||
        lastMessage.includes(normalizedQuery)
      );
    });
  }, [queue, queueFilter, query]);

  const canTakeOver = useMemo(() => {
    return session?.status === "WAITING_FOR_ADMIN" || session?.status === "AI_ACTIVE";
  }, [session?.status]);

  const handleSelectSession = useCallback(
    (targetSessionId: string) => {
      if (targetSessionId === sessionId) {
        return;
      }

      router.push(`/dashboard/chat/${targetSessionId}`);
    },
    [router, sessionId]
  );

  const handleEndTask = useCallback(async () => {
    if (!session || isEnding) {
      return;
    }

    const confirmed = window.confirm("ยืนยันว่าต้องการจบงานและลบห้องแชทนี้ใช่ไหม");
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

      await Promise.all([loadSession(), loadQueue()]);
    } catch (takeoverError) {
      console.error(takeoverError);
      setError("ไม่สามารถรับช่วงแชทได้");
    } finally {
      setIsTakingOver(false);
    }
  }, [isEnding, isTakingOver, loadQueue, loadSession, session]);

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

        const withoutOptimistic = current.messages.filter(
          (message) => message.id !== optimisticMessage.id
        );
        const nextMessages = [...withoutOptimistic];

        if (!nextMessages.some((message) => message.id === payload.message.id)) {
          nextMessages.push(payload.message);
        }

        if (
          payload.aiMessage &&
          !nextMessages.some((message) => message.id === payload.aiMessage?.id)
        ) {
          nextMessages.push(payload.aiMessage);
        }

        return {
          ...current,
          messages: nextMessages,
          updatedAt: (payload.aiMessage || payload.message).createdAt,
        };
      });

      setQueue((current) => {
        const existing = current.find((item) => item.id === session.id);
        if (!existing) {
          return current;
        }

        const nextSummary: ChatSessionSummaryDto = {
          ...existing,
          lastMessage: payload.aiMessage || payload.message,
          updatedAt: (payload.aiMessage || payload.message).createdAt,
          messageCount:
            existing.messageCount + (payload.aiMessage ? 2 : 1),
        };

        return upsertQueueSummary(current, nextSummary);
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
          messages: current.messages.filter(
            (message) => message.id !== optimisticMessage.id
          ),
        };
      });
    } finally {
      setIsSending(false);
    }
  }, [input, isEnding, isSending, session]);

  if (isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[390px_minmax(0,1fr)]">
        <div className="h-[72vh] animate-pulse rounded-3xl border border-gray-800 bg-gray-900/60" />
        <div className="h-[72vh] animate-pulse rounded-3xl border border-gray-800 bg-gray-900/60" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-3xl border border-rose-500/35 bg-rose-500/10 p-8 text-center">
        <p className="text-base font-semibold text-rose-200">ไม่พบห้องแชทนี้</p>
        <p className="mt-2 text-sm text-rose-200/80">ห้องนี้อาจถูกลบหรือหมดอายุแล้ว</p>
        <Link
          href="/dashboard/chat"
          className="mt-4 inline-flex rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200"
        >
          กลับไปหน้าคิวแชท
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[390px_minmax(0,1fr)]">
      <aside className="hidden xl:flex h-[72vh] flex-col overflow-hidden rounded-3xl border border-gray-800 bg-gray-900/65 shadow-lg shadow-black/20">
        <div className="space-y-3 border-b border-gray-800 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">กล่องข้อความลูกค้า</h2>
              <p className="mt-1 text-xs text-gray-500">เลือกห้องจากรายการเพื่อเปิดบทสนทนา</p>
            </div>
            <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-300">
              {queueCounts.total}
            </span>
          </div>

          <label className="relative block">
            <span className="sr-only">ค้นหาห้องแชท</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาจากชื่อ, รหัสผู้เยี่ยมชม หรือข้อความ"
              className="w-full rounded-xl border border-gray-700 bg-gray-950/80 px-3 py-2 pr-9 text-sm text-gray-100 outline-none transition placeholder:text-gray-500 focus:border-red-500/45"
            />
            <svg
              className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 104.473 8.7l2.663 2.664a.75.75 0 101.06-1.06l-2.663-2.663A5.5 5.5 0 009 3.5zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z"
                clipRule="evenodd"
              />
            </svg>
          </label>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-2 py-1.5">
              <p className="text-[10px] font-semibold text-amber-200">รอรับช่วง</p>
              <p className="text-sm font-bold text-amber-100">{queueCounts.waiting}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-2 py-1.5">
              <p className="text-[10px] font-semibold text-emerald-200">เจ้าหน้าที่</p>
              <p className="text-sm font-bold text-emerald-100">{queueCounts.adminActive}</p>
            </div>
            <div className="rounded-xl border border-sky-500/35 bg-sky-500/10 px-2 py-1.5">
              <p className="text-[10px] font-semibold text-sky-200">AI</p>
              <p className="text-sm font-bold text-sky-100">{queueCounts.aiActive}</p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800 px-2 py-1.5">
              <p className="text-[10px] font-semibold text-gray-400">ปิดแล้ว</p>
              <p className="text-sm font-bold text-gray-200">{queueCounts.closed}</p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {QUEUE_FILTERS.map((filter) => {
              const isActive = queueFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setQueueFilter(filter.value)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "border-red-500/45 bg-red-500/10 text-red-300"
                      : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {isQueueLoading ? (
            <div className="space-y-2">
              <div className="h-20 animate-pulse rounded-2xl bg-gray-800" />
              <div className="h-20 animate-pulse rounded-2xl bg-gray-800" />
              <div className="h-20 animate-pulse rounded-2xl bg-gray-800" />
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/60 px-3 py-6 text-center text-xs text-gray-500">
              ไม่พบห้องแชทตามเงื่อนไขที่เลือก
            </div>
          ) : (
            filteredQueue.map((item) => {
              const isSelected = item.id === sessionId;
              const displayName = formatQueueName(item.visitorName, item.visitorId);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSession(item.id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                    isSelected
                      ? "border-red-500/45 bg-red-500/12"
                      : "border-gray-800 bg-gray-950/70 hover:border-red-500/35 hover:bg-red-500/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${getStatusChipClass(item.status)}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs text-gray-400">{toPreviewText(item.lastMessage?.content)}</p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                    <span>{item.messageCount} ข้อความ</span>
                    <span>{formatTime(item.updatedAt)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex h-[calc(100dvh-6rem)] lg:h-[72vh] flex-col overflow-hidden rounded-3xl border border-gray-800 bg-gray-900/65 shadow-lg shadow-black/20">
        <header className="border-b border-gray-800 bg-gradient-to-r from-gray-900/90 via-gray-900/75 to-red-500/5 px-4 py-4 lg:px-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
            <div className="space-y-2 lg:space-y-1">
              <div className="flex items-center gap-2 text-sm xl:text-xs">
                <Link
                  href="/dashboard/chat"
                  className="flex items-center gap-1 font-medium text-gray-300 transition hover:text-white bg-gray-800/60 hover:bg-gray-800 px-3 py-1.5 xl:px-0 xl:py-0 xl:bg-transparent rounded-lg xl:rounded-none -ml-1 xl:ml-0"
                >
                  <svg className="w-4 h-4 xl:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  กลับไปหน้าคิวก่อนหน้า
                </Link>
                <span className="hidden xl:inline text-gray-600">/</span>
                <span className="hidden xl:inline font-semibold text-gray-200">ห้องที่เลือก</span>
              </div>

              <h1 className="text-lg font-semibold text-white">
                {formatQueueName(session.visitorName, session.visitorId)}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>รหัสห้อง: {session.id}</span>
                <span>•</span>
                <span>รหัสผู้เยี่ยมชม: {session.visitorId}</span>
                <span>•</span>
                <span>อัปเดตล่าสุด: {formatDateTime(session.updatedAt)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusChipClass(session.status)}`}
              >
                {getStatusLabel(session.status)}
              </span>

              {session.status !== "CLOSED" && canTakeOver ? (
                <button
                  type="button"
                  onClick={handleTakeOver}
                  disabled={isTakingOver || isEnding}
                  className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isTakingOver ? "กำลังรับช่วง..." : "รับช่วงคุย"}
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleEndTask}
                disabled={isEnding || isTakingOver || isSending}
                className="rounded-full border border-rose-500/35 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEnding ? "กำลังปิดห้อง..." : "จบงานและลบห้อง"}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-950/70 px-5 py-4">
          <div className="space-y-3">
            {session.messages.map((message) => {
              const isAdmin = message.senderType === "ADMIN";
              const isVisitor = message.senderType === "VISITOR";
              const isSystem = message.senderType === "SYSTEM";

              const bubbleClass = isAdmin
                ? "bg-gradient-to-br from-red-600 to-rose-600 text-white"
                : isVisitor
                  ? "border border-gray-700 bg-gray-800 text-gray-100"
                  : isSystem
                    ? "border border-amber-500/35 bg-amber-500/10 text-amber-200"
                    : "border border-sky-500/35 bg-sky-500/10 text-sky-200";

              const alignClass = isAdmin ? "justify-end" : "justify-start";

              return (
                <div key={message.id} className={`flex ${alignClass}`}>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${bubbleClass}`}>
                    <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                    <p
                      className={`mt-2 text-[11px] ${
                        isAdmin ? "text-red-100" : "text-gray-400"
                      }`}
                    >
                      {getSenderLabel(message.senderType)} • {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        </div>

        <footer className="space-y-3 border-t border-gray-800 bg-gray-900 px-4 py-4">
          <ChatInput
            value={input}
            disabled={isSending || isEnding || session.status === "CLOSED"}
            placeholder={
              session.status === "CLOSED"
                ? "ห้องนี้ปิดแล้ว ไม่สามารถส่งข้อความเพิ่มได้"
                : "พิมพ์ข้อความถึงลูกค้า..."
            }
            onChange={setInput}
            onSend={handleSend}
          />

          {session.status === "CLOSED" ? (
            <p className="text-xs font-medium text-gray-400">ห้องนี้ถูกปิดแล้ว หากต้องการช่วยเหลือลูกค้าให้เริ่มห้องใหม่</p>
          ) : null}

          {error ? <p className="text-xs font-medium text-rose-300">{error}</p> : null}
        </footer>
      </section>
    </div>
  );
}
