"use client";

import { useCallback, useEffect, useState } from "react";

type SnapshotStatus = {
  exists: boolean;
  updatedAt: string | null;
  contentLength: number;
};

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "ยังไม่เคยซิงก์";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function KnowledgeSyncButton() {
  const [status, setStatus] = useState<SnapshotStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setIsLoadingStatus(true);

    try {
      const response = await fetch("/api/chat/knowledge", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load knowledge status: ${response.status}`);
      }

      const payload = (await response.json()) as SnapshotStatus;
      setStatus(payload);
    } catch (error) {
      console.error(error);
      setFeedback("โหลดสถานะคลังความรู้ไม่สำเร็จ");
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleSync = useCallback(async () => {
    if (isSyncing) {
      return;
    }

    setIsSyncing(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/chat/knowledge", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to sync knowledge: ${response.status}`);
      }

      const payload = (await response.json()) as {
        changed: boolean;
        snapshot: {
          updatedAt: string;
          contentLength: number;
        };
      };

      setStatus({
        exists: true,
        updatedAt: payload.snapshot.updatedAt,
        contentLength: payload.snapshot.contentLength,
      });

      setFeedback(payload.changed ? "ซิงก์ข้อมูลเว็บใหม่เรียบร้อยแล้ว" : "ข้อมูลล่าสุดอยู่แล้ว แต่รีเฟรชเวลาอัปเดตสำเร็จ");
    } catch (error) {
      console.error(error);
      setFeedback("ซิงก์คลังความรู้ไม่สำเร็จ");
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleSync}
        disabled={isSyncing}
        className="rounded-full border border-gray-700 bg-gray-900/70 px-4 py-2 text-xs font-semibold text-gray-100 transition hover:border-gray-500 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSyncing ? "กำลังซิงก์ข้อมูล..." : "Sync Chat Knowledge"}
      </button>

      <p className="text-xs text-gray-400">
        {isLoadingStatus
          ? "กำลังโหลดสถานะคลังความรู้..."
          : `อัปเดตล่าสุด: ${formatUpdatedAt(status?.updatedAt ?? null)} | ขนาดข้อมูล: ${status?.contentLength ?? 0} ตัวอักษร`}
      </p>

      {feedback && <p className="text-xs text-emerald-300">{feedback}</p>}
    </div>
  );
}
