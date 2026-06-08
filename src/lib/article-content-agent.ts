import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { load } from "cheerio";
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import {
  DEFAULT_ARTICLE_AGENT_MODEL,
} from "@/src/lib/content-agent-models";
import {
  describeImageEvidence,
  scoreImageRelevance,
  type SourceImageEvidence,
} from "@/src/lib/ai-image-relevance";
import {
  blocksToHtml,
  estimateReadingTimeFromBlocks,
  type Block,
} from "@/src/lib/article-blocks";
import { safeAssetUrl } from "@/src/lib/api-normalize";
import { parseSiteContentSourceUrls } from "@/src/lib/site-content-agent";
import type {
  ArticleAgentPayload,
  ArticleAgentSection,
  ContentAgentRunResult,
} from "@/src/types/content-agent";

const CONFIG_ID = "article";
const DEFAULT_SOURCE_URLS = "https://www.true.th/true-online";
const DEFAULT_MODEL = DEFAULT_ARTICLE_AGENT_MODEL;
const MAX_SOURCE_BYTES = 4 * 1024 * 1024;
const MAX_MODEL_SOURCE_CHARS = 190_000;
const LOCK_DURATION_MS = 10 * 60 * 1000;

type RawArticle = {
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  primaryKeyword: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  imageMatchReason: string | null;
  imageConfidence: number;
  sections: ArticleAgentSection[];
  ctaLabel: string;
  ctaUrl: string;
  sourceUrls: string[];
};

type SourceDocument = {
  text: string;
  fingerprint: string;
  imageEvidence: Map<string, SourceImageEvidence>;
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

function normalizeText(value: unknown, maxLength = 10_000) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, maxLength)
    : "";
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
  const candidate = srcset
    ?.split(",")
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
        "User-Agent": "TrueFiberHomeArticleAgent/1.0",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Source returned HTTP ${response.status}.`);

    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > MAX_SOURCE_BYTES) {
      throw new Error(`Source page ${sourceUrl} is larger than 4 MB.`);
    }

    const $ = load(html);
    const imageEvidence = new Map<string, SourceImageEvidence>();

    $("img").each((_, node) => {
      const element = $(node);
      const imageUrl = getImageCandidate(element as any, sourceUrl);
      if (!imageUrl) {
        element.remove();
        return;
      }
      const alt = normalizeText(element.attr("alt"), 200);
      const context = normalizeText(
        element.closest("article,section,li,div").text(),
        600
      );
      imageEvidence.set(imageUrl, { url: imageUrl, alt, context });
      element.replaceWith(`\n[IMAGE alt="${alt}" src="${imageUrl}"]\n`);
    });

    const contentstackImages =
      html.match(/https:\/\/images\.contentstack\.io\/[^"'\\\s<>)]+/g) || [];
    for (const item of contentstackImages) {
      const imageUrl = resolveHttpUrl(item.replace(/&amp;/g, "&"), sourceUrl);
      if (!imageUrl || imageEvidence.has(imageUrl)) continue;
      const fileName = decodeURIComponent(
        new URL(imageUrl).pathname.split("/").at(-1) || ""
      );
      imageEvidence.set(imageUrl, {
        url: imageUrl,
        alt: fileName,
        context: fileName,
      });
    }

    $("script,style,noscript,svg,iframe,header,footer").remove();
    $("br").replaceWith("\n");
    $("h1,h2,h3,h4,p,li,article,section").each((_, node) => {
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

    return { html, text, imageEvidence };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSourceDocuments(sourceUrls: string[]): Promise<SourceDocument> {
  const pages = await Promise.all(sourceUrls.map(fetchSourcePage));
  const imageEvidence = new Map<string, SourceImageEvidence>();
  pages.forEach((page) =>
    page.imageEvidence.forEach((evidence, url) => {
      if (!imageEvidence.has(url)) imageEvidence.set(url, evidence);
    })
  );
  const sourceText = pages
    .map((page, index) => `SOURCE PAGE: ${sourceUrls[index]}\n${page.text}`)
    .join("\n\n---\n\n");
  const imageCatalog = Array.from(imageEvidence.values())
    .slice(0, 180)
    .map(describeImageEvidence)
    .join("\n");

  return {
    text: `${sourceText}\n\nSOURCE IMAGE CATALOG\n${imageCatalog}`.slice(
      0,
      MAX_MODEL_SOURCE_CHARS
    ),
    fingerprint: createHash("sha256")
      .update(pages.map((page) => page.html).join("\n"))
      .digest("hex"),
    imageEvidence,
  };
}

function buildSchema(maxItems: number) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      articles: {
        type: "array",
        maxItems,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            excerpt: { type: "string" },
            category: { type: "string" },
            tags: { type: "array", maxItems: 8, items: { type: "string" } },
            seoTitle: { type: "string" },
            seoDescription: { type: "string" },
            primaryKeyword: { type: "string" },
            coverImageUrl: { type: ["string", "null"] },
            coverImageAlt: { type: ["string", "null"] },
            imageMatchReason: { type: ["string", "null"] },
            imageConfidence: { type: "number", minimum: 0, maximum: 1 },
            sections: {
              type: "array",
              minItems: 3,
              maxItems: 7,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  heading: { type: "string" },
                  paragraphs: {
                    type: "array",
                    minItems: 1,
                    maxItems: 3,
                    items: { type: "string" },
                  },
                  bullets: {
                    type: "array",
                    maxItems: 7,
                    items: { type: "string" },
                  },
                },
                required: ["heading", "paragraphs", "bullets"],
              },
            },
            ctaLabel: { type: "string" },
            ctaUrl: {
              type: "string",
              enum: ["/boardband", "/service", "/home#packages"],
            },
            sourceUrls: {
              type: "array",
              minItems: 1,
              items: { type: "string" },
            },
          },
          required: [
            "title",
            "excerpt",
            "category",
            "tags",
            "seoTitle",
            "seoDescription",
            "primaryKeyword",
            "coverImageUrl",
            "coverImageAlt",
            "imageMatchReason",
            "imageConfidence",
            "sections",
            "ctaLabel",
            "ctaUrl",
            "sourceUrls",
          ],
        },
      },
    },
    required: ["articles"],
  };
}

async function extractArticles(
  sourceUrls: string[],
  source: SourceDocument,
  model: string,
  maxItems: number
) {
  const apiKey = stripEnvQuotes(process.env.OPENROUTER_API_KEY);
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing.");
  const baseUrl =
    stripEnvQuotes(process.env.OPENROUTER_BASE_URL) ||
    "https://openrouter.ai/api/v1";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL || "https://truefiberhome.com",
        "X-Title": "True Fiber Home Article Agent",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: [
              "You are the Thai editorial and SEO agent for a TrueOnline authorized partner.",
              "Write useful original Thai articles for customers choosing or using home internet.",
              "Use only factual claims found in the supplied true.th sources. Never invent prices, dates, speeds, coverage, contract terms, or benefits.",
              "Each article must answer a real search intent, avoid keyword stuffing, use clear headings, and contain practical decision guidance.",
              "SEO title should be 45-60 characters. SEO description should be 120-160 characters. The primary keyword must appear naturally in the title, excerpt, and first section.",
              "Use SOURCE_IMAGE only when its filename, alt text, and nearby source copy clearly match the article topic.",
              "Never use logos, icons, QR codes, app badges, generic brand backgrounds, or unrelated campaign art as a cover.",
              "A cover must be landscape editorial artwork. If evidence is weak, return null and imageConfidence below 0.6.",
              "Explain the exact evidence for the cover in imageMatchReason.",
              "Do not copy long passages from the source. Summarize facts in original wording.",
              "Choose one internal CTA URL from the schema. Do not place external sales links in the article body.",
            ].join(" "),
          },
          {
            role: "user",
            content: [
              `Create up to ${maxItems} article drafts.`,
              `Allowed source URLs:\n${sourceUrls.join("\n")}`,
              "Suggested search intents: choosing internet speed, WiFi coverage, router placement, streaming, gaming, work from home, installation preparation, package comparison.",
              source.text,
            ].join("\n\n"),
          },
        ],
        temperature: 0.2,
        top_p: 0.2,
        max_tokens: 8_000,
        provider: { require_parameters: true },
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "true_fiber_article_drafts",
            strict: true,
            schema: buildSchema(maxItems),
          },
        },
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(
        `OpenRouter returned HTTP ${response.status}: ${(await response.text()).slice(0, 1_000)}`
      );
    }
    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter returned an empty response.");
    const parsed = JSON.parse(content) as { articles?: RawArticle[] };
    return Array.isArray(parsed.articles)
      ? parsed.articles.slice(0, maxItems)
      : [];
  } finally {
    clearTimeout(timeout);
  }
}

function slugify(input: string) {
  return input
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9ก-๙-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeArticle(
  value: RawArticle,
  allowedSourceUrls: string[],
  source: SourceDocument
): ArticleAgentPayload | null {
  const title = normalizeText(value.title, 120);
  const excerpt = normalizeText(value.excerpt, 280);
  const category = normalizeText(value.category, 80) || "เน็ตบ้าน";
  const primaryKeyword = normalizeText(value.primaryKeyword, 80);
  const seoTitle = normalizeText(value.seoTitle, 65);
  const seoDescription = normalizeText(value.seoDescription, 170);
  if (
    title.length < 15 ||
    excerpt.length < 60 ||
    !primaryKeyword ||
    seoTitle.length < 20 ||
    seoDescription.length < 80
  ) {
    return null;
  }

  const sections = (Array.isArray(value.sections) ? value.sections : [])
    .map((section) => ({
      heading: normalizeText(section.heading, 140),
      paragraphs: (Array.isArray(section.paragraphs)
        ? section.paragraphs
        : []
      )
        .map((paragraph) => normalizeText(paragraph, 1_200))
        .filter((paragraph) => paragraph.length >= 40)
        .slice(0, 3),
      bullets: (Array.isArray(section.bullets) ? section.bullets : [])
        .map((bullet) => normalizeText(bullet, 280))
        .filter(Boolean)
        .slice(0, 7),
    }))
    .filter((section) => section.heading && section.paragraphs.length > 0)
    .slice(0, 7);
  const articleLength = sections
    .flatMap((section) => section.paragraphs)
    .join(" ").length;
  if (sections.length < 3 || articleLength < 1_200) return null;

  const sourceUrls = Array.from(
    new Set(
      (Array.isArray(value.sourceUrls) ? value.sourceUrls : [])
        .map((url) => resolveHttpUrl(url, allowedSourceUrls[0]))
        .filter(
          (url): url is string =>
            Boolean(url) && allowedSourceUrls.includes(url as string)
        )
    )
  );
  if (sourceUrls.length === 0) return null;

  const coverImageUrl = resolveHttpUrl(value.coverImageUrl, sourceUrls[0]);
  const modelConfidence = Math.max(
    0,
    Math.min(1, Number(value.imageConfidence) || 0)
  );
  const imageReview =
    coverImageUrl && source.imageEvidence.has(coverImageUrl)
      ? scoreImageRelevance({
          evidence: source.imageEvidence.get(coverImageUrl)!,
          title,
          description: `${excerpt} ${primaryKeyword}`,
          placement: "article-cover",
        })
      : null;
  const safeCoverImage =
    coverImageUrl &&
    safeAssetUrl(coverImageUrl) &&
    modelConfidence >= 0.6 &&
    imageReview?.accepted
      ? coverImageUrl
      : null;
  const ctaUrl = ["/boardband", "/service", "/home#packages"].includes(
    value.ctaUrl
  )
    ? value.ctaUrl
    : "/boardband";
  const slug = slugify(title);
  if (!slug) return null;

  const identity = `${title}|${primaryKeyword}|${sourceUrls.join("|")}`;
  return {
    externalKey: `article:${createHash("sha256")
      .update(identity)
      .digest("hex")
      .slice(0, 20)}`,
    title,
    slug,
    excerpt,
    category,
    tags: Array.from(
      new Set(
        (Array.isArray(value.tags) ? value.tags : [])
          .map((tag) => normalizeText(tag, 40))
          .filter(Boolean)
      )
    ).slice(0, 8),
    seoTitle,
    seoDescription,
    primaryKeyword,
    coverImageUrl: safeCoverImage,
    coverImageAlt: safeCoverImage
      ? normalizeText(value.coverImageAlt, 180) || title
      : null,
    imageMatchReason: safeCoverImage
      ? [
          normalizeText(value.imageMatchReason, 500),
          imageReview?.reason,
        ]
          .filter(Boolean)
          .join(" ")
      : null,
    imageConfidence: safeCoverImage
      ? Math.min(modelConfidence, imageReview?.confidence || 0)
      : 0,
    sections,
    ctaLabel: normalizeText(value.ctaLabel, 80) || "ดูแพ็กเกจเน็ตบ้าน",
    ctaUrl,
    sourceUrls,
  };
}

function payloadFingerprint(payload: ArticleAgentPayload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function articleBlocks(payload: ArticleAgentPayload): Block[] {
  const blocks: Block[] = [];
  payload.sections.forEach((section) => {
    blocks.push({
      id: randomUUID(),
      type: "heading",
      text: section.heading,
    });
    section.paragraphs.forEach((paragraph) =>
      blocks.push({
        id: randomUUID(),
        type: "paragraph",
        text: paragraph,
      })
    );
    if (section.bullets.length > 0) {
      blocks.push({
        id: randomUUID(),
        type: "list",
        ordered: false,
        items: section.bullets,
      });
    }
  });
  blocks.push({
    id: randomUUID(),
    type: "callout",
    variant: "info",
    title: "เลือกแพ็กเกจให้เหมาะกับบ้าน",
    text: "ความเร็วและบริการที่เหมาะสมขึ้นอยู่กับจำนวนผู้ใช้งาน อุปกรณ์ และพื้นที่ติดตั้ง ควรตรวจสอบเงื่อนไขล่าสุดก่อนสมัคร",
  });
  blocks.push({
    id: randomUUID(),
    type: "button",
    label: payload.ctaLabel,
    href: payload.ctaUrl,
    variant: "primary",
  });
  blocks.push({ id: randomUUID(), type: "divider" });
  blocks.push({
    id: randomUUID(),
    type: "paragraph",
    text: `แหล่งข้อมูลอ้างอิง: ${payload.sourceUrls
      .map((url, index) => `[True Online ${index + 1}](${url})`)
      .join(", ")}`,
  });
  return blocks;
}

export async function ensureArticleAgentConfig() {
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
        process.env.ARTICLE_AGENT_MODEL ||
        process.env.CONTENT_AGENT_MODEL ||
        DEFAULT_MODEL,
      maxItems: 2,
    },
  });
}

export async function publishArticleAgentPayload(payload: ArticleAgentPayload) {
  if (!payload.externalKey.startsWith("article:")) {
    throw new Error("Article Agent can publish only article drafts.");
  }
  const blocks = articleBlocks(payload);
  let slug = payload.slug;
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${payload.externalKey.slice(-6)}`;
  }
  return prisma.article.create({
    data: {
      title: payload.title,
      slug,
      excerpt: payload.excerpt,
      content: blocksToHtml(blocks),
      contentBlocks: blocks as any,
      coverImage: payload.coverImageUrl,
      category: payload.category,
      tags: payload.tags as any,
      layout: "default",
      author: "True Fiber Home",
      readingTime: estimateReadingTimeFromBlocks(blocks),
      isPublished: true,
      publishedAt: new Date(),
      seoTitle: payload.seoTitle,
      seoDescription: payload.seoDescription,
    },
  });
}

function revalidateArticlePaths(slug?: string) {
  revalidatePath("/articles");
  if (slug) revalidatePath(`/articles/${slug}`);
  revalidatePath("/dashboard/articles");
  revalidatePath("/dashboard/content-agent");
  revalidatePath("/sitemap.xml");
}

export async function runArticleAgent(
  trigger: "MANUAL" | "CRON"
): Promise<ContentAgentRunResult> {
  const { config, run, draft } = delegates();
  const settings = await ensureArticleAgentConfig();
  if (trigger === "CRON" && !settings.enabled) {
    return {
      status: "SKIPPED",
      discoveredCount: 0,
      draftCount: 0,
      publishedCount: 0,
      message: "Automatic article mode is disabled.",
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
      message: "Another Article Agent run is active.",
    };
  }

  const sourceUrls = parseSiteContentSourceUrls(settings.sourceUrl);
  const runRecord = await run.create({
    data: {
      trigger: `${trigger}_ARTICLE`,
      sourceUrl: sourceUrls.join("\n"),
      model: settings.model,
    },
  });

  try {
    const source = await fetchSourceDocuments(sourceUrls);
    const extracted = await extractArticles(
      sourceUrls,
      source,
      settings.model,
      Math.min(settings.maxItems, 6)
    );
    const normalized = extracted
      .map((article) => normalizeArticle(article, sourceUrls, source))
      .filter((article): article is ArticleAgentPayload => article !== null);
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
      if (existingFingerprints.has(`${payload.externalKey}:${fingerprint}`)) {
        continue;
      }
      const createdDraft = await draft.create({
        data: {
          runId: runRecord.id,
          externalKey: payload.externalKey,
          status: settings.autoPublish ? "AUTO_PUBLISHED" : "PENDING",
          title: payload.title,
          sourceUrl: payload.sourceUrls[0],
          imageUrl: payload.coverImageUrl,
          payload: payload as any,
          sourceFingerprint: fingerprint,
        },
      });
      draftCount += 1;
      if (settings.autoPublish) {
        const published = await publishArticleAgentPayload(payload);
        await draft.update({
          where: { id: createdDraft.id },
          data: {
            publishedPromotionId: published.id,
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
    revalidateArticlePaths();
    return {
      runId: runRecord.id,
      status: "SUCCEEDED",
      discoveredCount: normalized.length,
      draftCount,
      publishedCount,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.slice(0, 2_000)
        : "Article Agent failed.";
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

export async function approveArticleAgentDraft(id: string) {
  const { draft } = delegates();
  const record = await draft.findUnique({ where: { id } });
  if (
    !record ||
    record.status !== "PENDING" ||
    !record.externalKey.startsWith("article:")
  ) {
    throw new Error("Article draft is not available for approval.");
  }
  const published = await publishArticleAgentPayload(
    record.payload as ArticleAgentPayload
  );
  await draft.update({
    where: { id },
    data: {
      status: "APPROVED",
      publishedPromotionId: published.id,
      reviewedAt: new Date(),
    },
  });
  revalidateArticlePaths(published.slug);
  return published;
}
