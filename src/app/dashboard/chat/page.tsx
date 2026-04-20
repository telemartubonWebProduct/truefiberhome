import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { cleanupExpiredChatSessionsSafely } from "@/src/lib/chat-retention";
import ChatQueueNotifier from "@/src/app/dashboard/chat/components/ChatQueueNotifier";
import KnowledgeSyncButton from "@/src/app/dashboard/chat/components/KnowledgeSyncButton";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

const statusStyles: Record<string, string> = {
  AI_ACTIVE: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
  WAITING_FOR_ADMIN: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  ADMIN_ACTIVE: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  CLOSED: "bg-slate-500/10 text-slate-300 border border-slate-500/20",
};

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
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 120,
  });

  return (
    <div className="space-y-6">
      <ChatQueueNotifier />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Live Chat Sessions</h1>
          <p className="mt-1 text-sm text-gray-400">
            Monitor customer conversations and jump in when handoff is requested.
          </p>
        </div>

        <KnowledgeSyncButton />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No active chat sessions.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {sessions.map((session) => {
              const lastMessage = session.messages[0];

              return (
                <Link
                  key={session.id}
                  href={`/dashboard/chat/${session.id}`}
                  className="block p-5 transition hover:bg-gray-800/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-semibold text-gray-100">Session {session.id}</h2>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[session.status] || statusStyles.CLOSED}`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">Visitor: {session.visitorName || session.visitorId}</p>
                      <p className="line-clamp-2 text-sm text-gray-300">
                        {lastMessage ? lastMessage.content : "No messages yet"}
                      </p>
                    </div>

                    <div className="space-y-1 text-right text-xs text-gray-500">
                      <p>{session._count.messages} messages</p>
                      <p>Updated: {formatDateTime(session.updatedAt)}</p>
                      <p>
                        {session.assignedAdmin
                          ? `Admin: ${session.assignedAdmin.name}`
                          : "Unassigned"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
