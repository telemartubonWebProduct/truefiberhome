import { NextResponse } from "next/server";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import {
  approveContentAgentDraft,
  rejectContentAgentDraft,
} from "@/src/lib/content-agent";
import { prisma } from "@/src/lib/prisma";
import { approveSiteContentAgentDraft } from "@/src/lib/site-content-agent";
import { approveArticleAgentDraft } from "@/src/lib/article-content-agent";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const body = await request.json();

    if (body.action === "approve") {
      const draft = await (prisma as any).contentAgentDraft.findUnique({
        where: { id },
        select: { externalKey: true },
      });
      const published = draft?.externalKey?.startsWith("article:")
        ? await approveArticleAgentDraft(id)
        : draft?.externalKey?.startsWith("site-content:")
          ? await approveSiteContentAgentDraft(id)
          : await approveContentAgentDraft(id);
      return NextResponse.json({ ok: true, publishedId: String(published.id) });
    }

    if (body.action === "reject") {
      await rejectContentAgentDraft(id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
