import { NextRequest, NextResponse } from "next/server";
import { runContentAgent } from "@/src/lib/content-agent";
import { runSiteContentAgent } from "@/src/lib/site-content-agent";
import { runArticleAgent } from "@/src/lib/article-content-agent";

export const maxDuration = 60;

function stripQuotes(value: string | undefined) {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

export async function GET(request: NextRequest) {
  const cronSecret = stripQuotes(process.env.CRON_SECRET);
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [promotion, siteContent, article] = await Promise.all([
    runContentAgent("CRON"),
    runSiteContentAgent("CRON"),
    runArticleAgent("CRON"),
  ]);
  const failed =
    promotion.status === "FAILED" ||
    siteContent.status === "FAILED" ||
    article.status === "FAILED";

  return NextResponse.json(
    { promotion, siteContent, article },
    { status: failed ? 500 : 200 }
  );
}
