import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { load } from "cheerio";
import { revalidatePath } from "next/cache";
import { safeAssetUrl } from "@/src/lib/api-normalize";
import { DEFAULT_SITE_CONTENT_AGENT_MODEL } from "@/src/lib/content-agent-models";
import {
  describeImageEvidence,
  scoreImageRelevance,
  type SourceImageEvidence,
} from "@/src/lib/ai-image-relevance";
import { prisma } from "@/src/lib/prisma";
import type {
  ContentAgentRunResult,
  SiteContentAgentPayload,
  SiteContentTargetType,
} from "@/src/types/content-agent";

const CONFIG_ID = "site-content";
const DEFAULT_SOURCE_URLS = "https://www.true.th/true-online";
const DEFAULT_MODEL = DEFAULT_SITE_CONTENT_AGENT_MODEL;
const MAX_SOURCE_URLS = 6;
const MAX_SOURCE_BYTES = 4 * 1024 * 1024;
const MAX_MODEL_SOURCE_CHARS = 180_000;
const LOCK_DURATION_MS = 10 * 60 * 1000;
const HOME_SECTION_KEYS = [
  "homeInstallPromotion",
  "homePromotionPresent",
  "homeContactSection",
] as const;

type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

type RawSuggestion = {
  targetType: SiteContentTargetType;
  targetKey: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  imageAlt: string | null;
  imageMatchReason: string | null;
  imageConfidence: number;
  linkUrl: string | null;
  sourceUrl: string;
};

type SourceDocument = {
  text: string;
  fingerprint: string;
  imageEvidence: Map<string, SourceImageEvidence>;
  linkUrls: Set<string>;
};

function delegates() {
  const client = prisma as any;
  if (!client.contentAgentConfig || !client.contentAgentRun || !client.contentAgentDraft) {
    throw new Error("Content Agent database tables are not ready.");
  }

  return {
    config: client.contentAgentConfig,
    run: client.contentAgentRun,
    draft: client.contentAgentDraft,
  };
}

function stripEnvQuotes(value: string | undefined) {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function isAllowedTrueSource(value: string) {
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

export function parseSiteContentSourceUrls(value: string) {
  const urls = Array.from(
    new Set(
      value
        .split(/[\r\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

  if (urls.length === 0 || urls.length > MAX_SOURCE_URLS) {
    throw new Error(`Source URLs must contain between 1 and ${MAX_SOURCE_URLS} URLs.`);
  }

  if (urls.some((url) => !isAllowedTrueSource(url))) {
    throw new Error("Every source URL must use https://true.th or a true.th subdomain.");
  }

  return urls;
}

function resolveHttpUrl(value: string | null | undefined, baseUrl: string) {
  if (!value) return null;
  try {
    const url = new URL(value, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function getImageCandidate(
  element: ReturnType<ReturnType<typeof load>>,
  sourceUrl: string
) {
  const direct =
    element.attr("src") ||
    element.attr("data-src") ||
    element.attr("data-lazy-src") ||
    element.attr("data-original");
  if (direct) return resolveHttpUrl(direct, sourceUrl);

  const srcset = element.attr("srcset") || element.attr("data-srcset");
  if (!srcset) return null;
  const candidate = srcset
    .split(",")
    .map((item) => item.trim().split(/\s+/)[0])
    .filter(Boolean)
    .at(-1);
  return resolveHttpUrl(candidate, sourceUrl);
}

async function fetchSourcePage(sourceUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "TrueFiberHomeSiteContentAgent/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`True.th returned HTTP ${response.status}.`);

    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > MAX_SOURCE_BYTES) {
      throw new Error(`Source page ${sourceUrl} is larger than 4 MB.`);
    }

    const $ = load(html);
    const imageEvidence = new Map<string, SourceImageEvidence>();
    const linkUrls = new Set<string>();

    $("img").each((_, node) => {
      const element = $(node);
      const imageUrl = getImageCandidate(element as any, sourceUrl);
      const alt = normalizeText(element.attr("alt")).replace(/"/g, "'");
      if (!imageUrl) {
        element.remove();
        return;
      }

      const context = normalizeText(
        element
          .closest("article,section,li,div")
          .text()
          .slice(0, 500)
      );
      imageEvidence.set(imageUrl, { url: imageUrl, alt, context });
      element.replaceWith(`\n[IMAGE alt="${alt}" src="${imageUrl}"]\n`);
    });

    const contentstackImages =
      html.match(/https:\/\/images\.contentstack\.io\/[^"'\\\s<>)]+/g) || [];
    contentstackImages.forEach((item) => {
      const imageUrl = resolveHttpUrl(item.replace(/&amp;/g, "&"), sourceUrl);
      if (imageUrl && !imageEvidence.has(imageUrl)) {
        const fileName = decodeURIComponent(
          new URL(imageUrl).pathname.split("/").at(-1) || ""
        );
        imageEvidence.set(imageUrl, {
          url: imageUrl,
          alt: fileName,
          context: fileName,
        });
      }
    });

    $("a").each((_, node) => {
      const element = $(node);
      const href = resolveHttpUrl(element.attr("href"), sourceUrl);
      if (!href) return;
      linkUrls.add(href);
      element.append(` [LINK href="${href}"]`);
    });

    $("script, style, noscript, svg, iframe, header, footer").remove();
    $("br").replaceWith("\n");
    $("h1,h2,h3,h4,h5,h6,p,li,section,article").each((_, node) => {
      $(node).prepend("\n").append("\n");
    });

    const root = $("main").length > 0 ? $("main") : $("body");
    const text = root
      .text()
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return { html, text, imageEvidence, linkUrls };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSourceDocuments(sourceUrls: string[]): Promise<SourceDocument> {
  const pages = await Promise.all(sourceUrls.map((url) => fetchSourcePage(url)));
  const imageEvidence = new Map<string, SourceImageEvidence>();
  const linkUrls = new Set<string>();

  pages.forEach((page) => {
    page.imageEvidence.forEach((evidence, url) => {
      if (!imageEvidence.has(url)) imageEvidence.set(url, evidence);
    });
    page.linkUrls.forEach((url) => linkUrls.add(url));
  });

  const imageCatalog = Array.from(imageEvidence.values())
    .slice(0, 180)
    .map(describeImageEvidence)
    .join("\n");
  const text = pages
    .map((page, index) => `SOURCE PAGE: ${sourceUrls[index]}\n${page.text}`)
    .join("\n\n---\n\n");

  return {
    text: `${text}\n\nSOURCE IMAGE CATALOG\n${imageCatalog}`.slice(
      0,
      MAX_MODEL_SOURCE_CHARS
    ),
    fingerprint: createHash("sha256")
      .update(pages.map((page) => page.html).join("\n"))
      .digest("hex"),
    imageEvidence,
    linkUrls,
  };
}

function buildSchema(maxItems: number) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      suggestions: {
        type: "array",
        maxItems,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            targetType: { type: "string", enum: ["HOME_SECTION", "BANNER"] },
            targetKey: {
              type: ["string", "null"],
              enum: [...HOME_SECTION_KEYS, null],
            },
            title: { type: ["string", "null"] },
            subtitle: { type: ["string", "null"] },
            description: { type: ["string", "null"] },
            imageUrl: { type: ["string", "null"] },
            mobileImageUrl: { type: ["string", "null"] },
            imageAlt: { type: ["string", "null"] },
            imageMatchReason: { type: ["string", "null"] },
            imageConfidence: { type: "number", minimum: 0, maximum: 1 },
            linkUrl: { type: ["string", "null"] },
            sourceUrl: { type: "string" },
          },
          required: [
            "targetType",
            "targetKey",
            "title",
            "subtitle",
            "description",
            "imageUrl",
            "mobileImageUrl",
            "imageAlt",
            "imageMatchReason",
            "imageConfidence",
            "linkUrl",
            "sourceUrl",
          ],
        },
      },
    },
    required: ["suggestions"],
  };
}

async function extractSuggestions(
  sourceUrls: string[],
  source: SourceDocument,
  model: string,
  maxItems: number
): Promise<RawSuggestion[]> {
  const apiKey = stripEnvQuotes(process.env.OPENROUTER_API_KEY);
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing.");

  const baseUrl =
    stripEnvQuotes(process.env.OPENROUTER_BASE_URL) || "https://openrouter.ai/api/v1";
  const currentSections = await prisma.homeSection.findMany({
    where: { sectionKey: { in: [...HOME_SECTION_KEYS] } },
    select: {
      sectionKey: true,
      title: true,
      subtitle: true,
      imageUrl: true,
      linkUrl: true,
    },
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50_000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://truefiberhome.com",
        "X-Title": "True Fiber Home Site Content Agent",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: [
              "You are a factual website content editor for a TrueOnline authorized partner.",
              "Use only facts, offers, links, and image URLs explicitly present in the supplied true.th source.",
              "Do not invent prices, claims, dates, benefits, links, or images.",
              "HOME_SECTION suggestions update concise Thai headings and supporting copy.",
              "HOME_SECTION suggestions must set imageUrl and mobileImageUrl to null because those slots are text-only.",
              "BANNER suggestions require a wide campaign image from the same source context that clearly matches the exact title and offer.",
              "Never use logos, icons, app badges, QR codes, portraits, square images, or generic brand art as banners.",
              "Read SOURCE_IMAGE alt and nearby fields. If they do not prove relevance, return null instead of guessing.",
              "Set imageConfidence below 0.6 when the evidence is weak. Explain the exact filename, alt text, or nearby source copy in imageMatchReason.",
              "Use only target keys from the provided schema.",
              "Prefer current, customer-facing promotions and skip navigation, FAQs, billing, and troubleshooting.",
            ].join(" "),
          },
          {
            role: "user",
            content: [
              `Source URLs:\n${sourceUrls.join("\n")}`,
              `Current editable home sections:\n${JSON.stringify(currentSections)}`,
              `Create up to ${maxItems} useful content or banner suggestions.`,
              source.text,
            ].join("\n\n"),
          },
        ],
        temperature: 0,
        top_p: 0.1,
        max_tokens: 6_000,
        provider: { require_parameters: true },
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "true_site_content_suggestions",
            strict: true,
            schema: buildSchema(maxItems),
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `OpenRouter returned HTTP ${response.status}: ${(await response.text()).slice(0, 1000)}`
      );
    }

    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter returned an empty response.");

    const parsed = JSON.parse(content) as { suggestions?: RawSuggestion[] };
    return Array.isArray(parsed.suggestions)
      ? parsed.suggestions.slice(0, maxItems)
      : [];
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeSuggestion(
  value: RawSuggestion,
  sourceUrls: string[],
  source: SourceDocument
): SiteContentAgentPayload | null {
  const targetType =
    value.targetType === "HOME_SECTION" || value.targetType === "BANNER"
      ? value.targetType
      : null;
  if (!targetType) return null;

  const targetKey = normalizeText(value.targetKey);
  if (
    targetType === "HOME_SECTION" &&
    !HOME_SECTION_KEYS.includes(targetKey as HomeSectionKey)
  ) {
    return null;
  }

  const sourceUrl = resolveHttpUrl(value.sourceUrl, sourceUrls[0]);
  if (!sourceUrl || !sourceUrls.includes(sourceUrl)) return null;

  const imageUrl = resolveHttpUrl(value.imageUrl, sourceUrl);
  const mobileImageUrl = resolveHttpUrl(value.mobileImageUrl, sourceUrl);
  const linkUrl = resolveHttpUrl(value.linkUrl, sourceUrl);
  const title = normalizeText(value.title) || null;
  const subtitle = normalizeText(value.subtitle) || null;
  const description = normalizeText(value.description) || null;
  const imageAlt = normalizeText(value.imageAlt) || null;
  const modelImageReason = normalizeText(value.imageMatchReason) || null;
  const modelImageConfidence = Math.max(
    0,
    Math.min(1, Number(value.imageConfidence) || 0)
  );

  if (targetType === "BANNER" && (!title || !imageUrl)) return null;
  if (targetType === "HOME_SECTION" && !title && !subtitle) return null;

  const imageReview =
    targetType === "BANNER" && imageUrl
      ? (() => {
          const evidence = source.imageEvidence.get(imageUrl);
          if (!evidence || !safeAssetUrl(imageUrl)) return null;
          return scoreImageRelevance({
            evidence,
            title: title || "",
            description,
            placement: "banner",
          });
        })()
      : null;
  const safeImageUrl =
    targetType === "BANNER" &&
    imageUrl &&
    imageReview?.accepted &&
    modelImageConfidence >= 0.6
      ? imageUrl
      : null;
  const mobileImageReview =
    targetType === "BANNER" && mobileImageUrl
      ? (() => {
          const evidence = source.imageEvidence.get(mobileImageUrl);
          if (!evidence || !safeAssetUrl(mobileImageUrl)) return null;
          return scoreImageRelevance({
            evidence,
            title: title || "",
            description,
            placement: "article-cover",
          });
        })()
      : null;
  const safeMobileImageUrl =
    mobileImageUrl && mobileImageReview?.accepted ? mobileImageUrl : null;
  const safeLinkUrl = linkUrl && source.linkUrls.has(linkUrl) ? linkUrl : null;
  if (targetType === "BANNER" && !safeImageUrl) return null;

  const identity = [
    targetType,
    targetKey,
    title,
    safeImageUrl,
    safeLinkUrl,
  ].join("|");
  const externalKey = `site-content:${createHash("sha256")
    .update(identity)
    .digest("hex")
    .slice(0, 20)}`;

  return {
    externalKey,
    targetType,
    targetKey: targetType === "HOME_SECTION" ? targetKey : null,
    title,
    subtitle,
    description,
    imageUrl: safeImageUrl,
    mobileImageUrl: safeMobileImageUrl,
    imageAlt: safeImageUrl ? imageAlt || title : null,
    imageMatchReason: safeImageUrl
      ? [modelImageReason, imageReview?.reason].filter(Boolean).join(" ")
      : null,
    imageConfidence: safeImageUrl
      ? Math.min(modelImageConfidence, imageReview?.confidence || 0)
      : 0,
    linkUrl: safeLinkUrl,
    sourceUrl,
  };
}

function payloadFingerprint(payload: SiteContentAgentPayload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function ensureSiteContentAgentConfig() {
  const { config } = delegates();
  return config.upsert({
    where: { id: CONFIG_ID },
    update: {},
    create: {
      id: CONFIG_ID,
      enabled: false,
      autoPublish: false,
      sourceUrl: DEFAULT_SOURCE_URLS,
      model:
        process.env.SITE_CONTENT_AGENT_MODEL ||
        process.env.CONTENT_AGENT_MODEL ||
        DEFAULT_MODEL,
      maxItems: 12,
    },
  });
}

export async function publishSiteContentPayload(payload: SiteContentAgentPayload) {
  if (!payload.externalKey.startsWith("site-content:")) {
    throw new Error("Site Content Agent can publish only site-content drafts.");
  }

  if (payload.targetType === "HOME_SECTION") {
    if (!payload.targetKey) throw new Error("Home section target is missing.");
    const data = {
      ...(payload.title ? { title: payload.title } : {}),
      ...(payload.subtitle ? { subtitle: payload.subtitle } : {}),
      ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
      ...(payload.linkUrl ? { linkUrl: payload.linkUrl } : {}),
      isActive: true,
    };

    return prisma.homeSection.upsert({
      where: { sectionKey: payload.targetKey },
      update: data,
      create: {
        sectionKey: payload.targetKey,
        ...data,
      },
    });
  }

  const maxOrder = await prisma.banner.aggregate({ _max: { displayOrder: true } });
  return prisma.banner.create({
    data: {
      title: payload.title,
      description: payload.description || payload.subtitle,
      imageUrl: payload.imageUrl!,
      mobileImage: payload.mobileImageUrl,
      linkUrl: payload.linkUrl,
      isActive: true,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
  });
}

function revalidateSiteContentPaths() {
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/dashboard/home-content");
  revalidatePath("/dashboard/banners");
  revalidatePath("/dashboard/content-agent");
}

export async function runSiteContentAgent(
  trigger: "MANUAL" | "CRON"
): Promise<ContentAgentRunResult> {
  const { config, run, draft } = delegates();
  const settings = await ensureSiteContentAgentConfig();

  if (trigger === "CRON" && !settings.enabled) {
    return {
      status: "SKIPPED",
      discoveredCount: 0,
      draftCount: 0,
      publishedCount: 0,
      message: "Automatic site content mode is disabled.",
    };
  }

  const lockToken = randomUUID();
  const now = new Date();
  const lockResult = await config.updateMany({
    where: {
      id: CONFIG_ID,
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
    },
    data: {
      lockToken,
      lockedUntil: new Date(now.getTime() + LOCK_DURATION_MS),
      lastRunAt: now,
      lastError: null,
    },
  });

  if (lockResult.count !== 1) {
    return {
      status: "SKIPPED",
      discoveredCount: 0,
      draftCount: 0,
      publishedCount: 0,
      message: "Another Site Content Agent run is active.",
    };
  }

  const sourceUrls = parseSiteContentSourceUrls(settings.sourceUrl);
  const runRecord = await run.create({
    data: {
      trigger: `${trigger}_SITE_CONTENT`,
      sourceUrl: sourceUrls.join("\n"),
      model: settings.model,
    },
  });

  try {
    const source = await fetchSourceDocuments(sourceUrls);
    const extracted = await extractSuggestions(
      sourceUrls,
      source,
      settings.model,
      settings.maxItems
    );
    const normalized = extracted
      .map((item) => normalizeSuggestion(item, sourceUrls, source))
      .filter((item): item is SiteContentAgentPayload => item !== null);
    const existingDrafts = await draft.findMany({
      where: { externalKey: { in: normalized.map((item) => item.externalKey) } },
      select: { externalKey: true, sourceFingerprint: true, status: true },
    });
    const existingFingerprints = new Set(
      existingDrafts
        .filter((item: any) => item.status !== "REJECTED")
        .map((item: any) => `${item.externalKey}:${item.sourceFingerprint}`)
    );

    let draftCount = 0;
    let publishedCount = 0;

    for (const payload of normalized) {
      const fingerprint = payloadFingerprint(payload);
      if (existingFingerprints.has(`${payload.externalKey}:${fingerprint}`)) continue;

      const createdDraft = await draft.create({
        data: {
          runId: runRecord.id,
          externalKey: payload.externalKey,
          status: settings.autoPublish ? "AUTO_PUBLISHED" : "PENDING",
          title: payload.title || payload.targetKey || "Site content suggestion",
          sourceUrl: payload.sourceUrl,
          imageUrl: payload.imageUrl,
          payload: payload as any,
          sourceFingerprint: fingerprint,
        },
      });
      draftCount += 1;

      if (settings.autoPublish) {
        const published = await publishSiteContentPayload(payload);
        await draft.update({
          where: { id: createdDraft.id },
          data: {
            publishedPromotionId: String(published.id),
            reviewedAt: new Date(),
          },
        });
        publishedCount += 1;
      }
    }

    await Promise.all([
      run.update({
        where: { id: runRecord.id },
        data: {
          status: "SUCCEEDED",
          discoveredCount: normalized.length,
          draftCount,
          publishedCount,
          sourceFingerprint: source.fingerprint,
          finishedAt: new Date(),
        },
      }),
      config.update({
        where: { id: CONFIG_ID },
        data: { lastSuccessAt: new Date(), lastError: null },
      }),
    ]);

    revalidateSiteContentPaths();
    return {
      runId: runRecord.id,
      status: "SUCCEEDED",
      discoveredCount: normalized.length,
      draftCount,
      publishedCount,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 2_000) : "Site Content Agent failed.";
    await Promise.all([
      run.update({
        where: { id: runRecord.id },
        data: { status: "FAILED", errorMessage: message, finishedAt: new Date() },
      }),
      config.update({ where: { id: CONFIG_ID }, data: { lastError: message } }),
    ]);
    return {
      runId: runRecord.id,
      status: "FAILED",
      discoveredCount: 0,
      draftCount: 0,
      publishedCount: 0,
      message,
    };
  } finally {
    await config.updateMany({
      where: { id: CONFIG_ID, lockToken },
      data: { lockToken: null, lockedUntil: null },
    });
  }
}

export async function approveSiteContentAgentDraft(id: string) {
  const { draft } = delegates();
  const record = await draft.findUnique({ where: { id } });
  if (
    !record ||
    record.status !== "PENDING" ||
    !record.externalKey.startsWith("site-content:")
  ) {
    throw new Error("Site content draft is not available for approval.");
  }

  const published = await publishSiteContentPayload(
    record.payload as SiteContentAgentPayload
  );
  await draft.update({
    where: { id },
    data: {
      status: "APPROVED",
      publishedPromotionId: String(published.id),
      reviewedAt: new Date(),
    },
  });
  revalidateSiteContentPaths();
  return published;
}
