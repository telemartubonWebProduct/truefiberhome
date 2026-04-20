import { NextResponse } from "next/server";
import {
  getKnowledgeSnapshotStatus,
  refreshKnowledgeSnapshotSafely,
} from "@/src/lib/chat-knowledge";
import { requireAdmin } from "@/src/lib/dashboard-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) {
    return auth.response;
  }

  try {
    const status = await getKnowledgeSnapshotStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("GET /api/chat/knowledge failed:", error);
    return NextResponse.json({ error: "Failed to get knowledge snapshot status" }, { status: 500 });
  }
}

export async function POST() {
  const auth = await requireAdmin();
  if (auth.response) {
    return auth.response;
  }

  try {
    const before = await getKnowledgeSnapshotStatus();
    const refreshed = await refreshKnowledgeSnapshotSafely({ force: true });

    if (!refreshed) {
      return NextResponse.json({ error: "Failed to refresh knowledge snapshot" }, { status: 500 });
    }

    const changed = !before.exists || before.hash !== refreshed.hash;

    return NextResponse.json({
      success: true,
      changed,
      snapshot: {
        id: refreshed.id,
        hash: refreshed.hash,
        updatedAt: refreshed.updatedAt.toISOString(),
        createdAt: refreshed.createdAt.toISOString(),
        contentLength: refreshed.content.length,
      },
    });
  } catch (error) {
    console.error("POST /api/chat/knowledge failed:", error);
    return NextResponse.json({ error: "Failed to refresh knowledge snapshot" }, { status: 500 });
  }
}
