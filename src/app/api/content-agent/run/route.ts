import { NextResponse } from "next/server";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { runContentAgent } from "@/src/lib/content-agent";
import { runSiteContentAgent } from "@/src/lib/site-content-agent";
import { runArticleAgent } from "@/src/lib/article-content-agent";
import type { ContentAgentScope } from "@/src/types/content-agent";

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => ({}))) as {
    scope?: ContentAgentScope;
  };
  const result =
    body.scope === "article"
      ? await runArticleAgent("MANUAL")
      : body.scope === "site-content"
        ? await runSiteContentAgent("MANUAL")
        : await runContentAgent("MANUAL");

  return NextResponse.json(result, {
    status: result.status === "FAILED" ? 500 : 200,
  });
}
