import Link from "next/link";
import { cleanupExpiredChatSessionsSafely } from "@/src/lib/chat-retention";
import { prisma } from "@/src/lib/prisma";
import type { ChatStatusValue } from "@/src/types/chat";
import ChatQueueNotifier from "@/src/app/dashboard/chat/components/ChatQueueNotifier";
import KnowledgeSyncButton from "@/src/app/dashboard/chat/components/KnowledgeSyncButton";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatDisplayName(name: string | null, visitorId: string) {
  if (name && name.trim().length > 0) {
    return name.trim();
  }

  return `ผู้เยี่ยมชม ${visitorId.slice(0, 8)}`;
}

function getPreviewText(content: string | null | undefined) {
  if (!content || content.trim().length === 0) {
    return "ยังไม่มีข้อความในห้องนี้";
  }

  const compact = content.replace(/\s+/g, " ").trim();
  return compact.length > 84 ? `${compact.slice(0, 83)}…` : compact;
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

  return "ปิดแล้ว";
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

export default async function DashboardChatPage() {
  await cleanupExpiredChatSessionsSafely();

  const sessions = await prisma.chatSession.findMany({
    where: {
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
      assignedAdmin: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 160,
  });

  const waitingSessions = sessions.filter((session) => session.status === "WAITING_FOR_ADMIN");
  const adminSessions = sessions.filter((session) => session.status === "ADMIN_ACTIVE");
  const aiSessions = sessions.filter((session) => session.status === "AI_ACTIVE");

  const statusCards: Array<{ label: string; count: number; className: string }> = [
    {
      label: "รอเจ้าหน้าที่",
      count: waitingSessions.length,
      className: "border-amber-500/35 bg-amber-500/10",
    },
    {
      label: "เจ้าหน้าที่กำลังดูแล",
      count: adminSessions.length,
      className: "border-emerald-500/35 bg-emerald-500/10",
    },
    {
      label: "AI กำลังตอบ",
      count: aiSessions.length,
      className: "border-sky-500/35 bg-sky-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <ChatQueueNotifier />

      <section className="rounded-3xl border border-gray-800 bg-gray-900/65 p-5 shadow-lg shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white">ศูนย์จัดการแชทลูกค้า</h1>
            <p className="text-sm text-gray-400">
              ดูคิวล่าสุด แยกสถานะชัดเจน และเข้าไปรับช่วงคุยกับลูกค้าได้ทันที
            </p>
          </div>
          <KnowledgeSyncButton />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {statusCards.map((card) => (
            <div key={card.label} className={`rounded-2xl border px-4 py-3 ${card.className}`}>
              <p className="text-xs font-medium text-gray-300">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{card.count}</p>
            </div>
          ))}
        </div>
      </section>

      {sessions.length === 0 ? (
        <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-12 text-center shadow-lg shadow-black/20">
          <p className="text-base font-semibold text-white">ยังไม่มีคิวแชทที่กำลังดำเนินการ</p>
          <p className="mt-2 text-sm text-gray-400">เมื่อมีลูกค้าทักเข้ามา ระบบจะแสดงรายการที่นี่โดยอัตโนมัติ</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-gray-800 bg-gray-900/65 shadow-lg shadow-black/20">
            <div className="border-b border-gray-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">คิวแชทล่าสุด</h2>
              <p className="mt-1 text-xs text-gray-500">เรียงจากห้องที่มีความเคลื่อนไหวล่าสุด</p>
            </div>

            <div className="max-h-[60vh] xl:max-h-[68vh] space-y-2 overflow-y-auto p-3">
              {sessions.map((session) => {
                const lastMessage = session.messages[0];
                const displayName = formatDisplayName(session.visitorName, session.visitorId);

                return (
                  <Link
                    key={session.id}
                    href={`/dashboard/chat/${session.id}`}
                    className="group block rounded-2xl border border-gray-800 bg-gray-950/70 p-3 transition hover:border-red-500/35 hover:bg-red-500/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-400">{getPreviewText(lastMessage?.content)}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${getStatusChipClass(session.status)}`}
                      >
                        {getStatusLabel(session.status)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                      <span>{session._count.messages} ข้อความ</span>
                      <span>{formatDateTime(session.updatedAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>

          <section className="grid gap-4 lg:grid-cols-3">
            {[
              {
                key: "WAITING_FOR_ADMIN",
                title: "รอเจ้าหน้าที่",
                sessions: waitingSessions,
                emptyText: "ยังไม่มีห้องที่รอรับช่วง",
                panelClass: "border-amber-500/35 bg-amber-500/5",
              },
              {
                key: "ADMIN_ACTIVE",
                title: "เจ้าหน้าที่กำลังดูแล",
                sessions: adminSessions,
                emptyText: "ยังไม่มีห้องที่แอดมินกำลังดูแล",
                panelClass: "border-emerald-500/35 bg-emerald-500/5",
              },
              {
                key: "AI_ACTIVE",
                title: "AI กำลังตอบ",
                sessions: aiSessions,
                emptyText: "ยังไม่มีห้องที่ AI กำลังตอบ",
                panelClass: "border-sky-500/35 bg-sky-500/5",
              },
            ].map((column) => (
              <div key={column.key} className={`rounded-3xl border p-4 shadow-sm ${column.panelClass}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{column.title}</h3>
                  <span className="rounded-full bg-gray-900 px-2 py-1 text-xs font-semibold text-gray-300">
                    {column.sessions.length}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {column.sessions.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-700 bg-gray-900/65 px-3 py-4 text-center text-xs text-gray-500">
                      {column.emptyText}
                    </p>
                  ) : (
                    column.sessions.slice(0, 8).map((session) => (
                      <Link
                        key={session.id}
                        href={`/dashboard/chat/${session.id}`}
                        className="block rounded-xl border border-gray-800 bg-gray-900/80 px-3 py-2 transition hover:border-red-500/35 hover:bg-red-500/10"
                      >
                        <p className="truncate text-sm font-medium text-white">
                          {formatDisplayName(session.visitorName, session.visitorId)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                          {getPreviewText(session.messages[0]?.content)}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
