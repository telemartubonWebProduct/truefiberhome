import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { ensureContentAgentConfig } from "@/src/lib/content-agent";
import { prisma } from "@/src/lib/prisma";
import {
  ensureSiteContentAgentConfig,
  parseSiteContentSourceUrls,
} from "@/src/lib/site-content-agent";
import type { ContentAgentScope } from "@/src/types/content-agent";
import { isSupportedContentAgentModel } from "@/src/lib/content-agent-models";
import { ensureArticleAgentConfig } from "@/src/lib/article-content-agent";

function isAllowedSourceUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "true.th" || url.hostname.endsWith(".true.th"))
    );
  } catch {
    return false;
  }
}

function getScope(value: unknown): ContentAgentScope {
  if (value === "site-content" || value === "article") return value;
  return "promotion";
}

export async function GET(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) return auth.response;

  try {
    const scope = getScope(new URL(request.url).searchParams.get("scope"));
    return NextResponse.json(
      scope === "article"
        ? await ensureArticleAgentConfig()
        : scope === "site-content"
          ? await ensureSiteContentAgentConfig()
          : await ensureContentAgentConfig()
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const scope = getScope(body.scope);
    const current =
      scope === "article"
        ? await ensureArticleAgentConfig()
        : scope === "site-content"
          ? await ensureSiteContentAgentConfig()
          : await ensureContentAgentConfig();
    const sourceUrl =
      typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : current.sourceUrl;
    const model = typeof body.model === "string" ? body.model.trim() : current.model;
    const maxItems = Number(body.maxItems ?? current.maxItems);

    if (scope === "site-content" || scope === "article") {
      try {
        parseSiteContentSourceUrls(sourceUrl);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Source URLs are invalid." },
          { status: 400 }
        );
      }
    } else if (!isAllowedSourceUrl(sourceUrl)) {
      return NextResponse.json(
        { error: "Source URL must use https://true.th or a true.th subdomain." },
        { status: 400 }
      );
    }

    if (!isSupportedContentAgentModel(model)) {
      return NextResponse.json(
        { error: "OpenRouter model is not in the supported model list." },
        { status: 400 }
      );
    }

    const maximumItems = scope === "article" ? 6 : 30;
    if (!Number.isInteger(maxItems) || maxItems < 1 || maxItems > maximumItems) {
      return NextResponse.json(
        { error: `maxItems must be between 1 and ${maximumItems}.` },
        { status: 400 }
      );
    }

    const updated = await (prisma as any).contentAgentConfig.update({
      where: {
        id:
          scope === "article"
            ? "article"
            : scope === "site-content"
              ? "site-content"
              : "singleton",
      },
      data: {
        enabled: typeof body.enabled === "boolean" ? body.enabled : current.enabled,
        autoPublish:
          typeof body.autoPublish === "boolean"
            ? body.autoPublish
            : current.autoPublish,
        sourceUrl,
        model,
        maxItems,
      },
    });

    revalidatePath("/dashboard/content-agent");
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
