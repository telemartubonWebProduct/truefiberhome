"use client";

import { useCallback, useEffect, useRef } from "react";
import { createClient } from "@/src/lib/supabase";
import type { ChatSessionSummaryDto } from "@/src/types/chat";

const QUEUE_POLL_INTERVAL_MS = 4000;

function playNotifyTone() {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") {
    return;
  }

  const audioCtx = new window.AudioContext();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.value = 740;
  gainNode.gain.value = 0.08;

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.14);
}

export default function ChatQueueNotifier() {
  const waitingSessionIds = useRef<Set<string>>(new Set());

  const notifyQueue = useCallback((title: string, body: string) => {
    playNotifyTone();

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(title, { body });
    }
  }, []);

  const syncWaitingQueue = useCallback(
    async (notifyOnNew: boolean) => {
      const response = await fetch("/api/chat/sessions?status=WAITING_FOR_ADMIN", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Queue poll failed: ${response.status}`);
      }

      const sessions = (await response.json()) as ChatSessionSummaryDto[];
      const nextWaitingIds = new Set(sessions.map((session) => session.id));

      if (notifyOnNew) {
        for (const id of nextWaitingIds) {
          if (!waitingSessionIds.current.has(id)) {
            notifyQueue("มีลูกค้ารอเจ้าหน้าที่", "มีคำขอพูดคุยใหม่ในคิวแชทสด");
          }
        }
      }

      waitingSessionIds.current = nextWaitingIds;
    },
    [notifyQueue]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    void syncWaitingQueue(false).catch(() => {
      // Silent warm-up; realtime/polling retries continue in the background.
    });

    const intervalId = window.setInterval(() => {
      void syncWaitingQueue(true).catch(() => {
        // Silent fallback; next poll will retry.
      });
    }, QUEUE_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [syncWaitingQueue]);

  useEffect(() => {
    const supabase = createClient();

    const queueChannel = supabase
      .channel("dashboard-chat-queue")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_sessions",
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.status !== "WAITING_FOR_ADMIN" || typeof row.id !== "string") {
            return;
          }

          if (waitingSessionIds.current.has(row.id)) {
            return;
          }

          waitingSessionIds.current.add(row.id);
          notifyQueue("มีลูกค้ารอเจ้าหน้าที่", "มีคำขอพูดคุยใหม่ในคิวแชทสด");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_sessions",
        },
        (payload) => {
          const next = payload.new as Record<string, unknown>;
          const prev = payload.old as Record<string, unknown>;

          if (
            next.status === "WAITING_FOR_ADMIN" &&
            prev.status !== "WAITING_FOR_ADMIN" &&
            typeof next.id === "string"
          ) {
            if (!waitingSessionIds.current.has(next.id)) {
              waitingSessionIds.current.add(next.id);
              notifyQueue("ลูกค้าขอคุยกับเจ้าหน้าที่", "มีห้องแชทใหม่รอการรับช่วง");
            }

            return;
          }

          if (
            prev.status === "WAITING_FOR_ADMIN" &&
            next.status !== "WAITING_FOR_ADMIN" &&
            typeof next.id === "string"
          ) {
            waitingSessionIds.current.delete(next.id);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(queueChannel);
    };
  }, [notifyQueue]);

  return null;
}
