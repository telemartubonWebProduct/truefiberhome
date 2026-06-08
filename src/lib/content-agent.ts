import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { load } from "cheerio";
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { safeAssetUrl } from "@/src/lib/api-normalize";
import { DEFAULT_PROMOTION_AGENT_MODEL } from "@/src/lib/content-agent-models";
import {
  describeImageEvidence,
  scoreImageRelevance,
  type SourceImageEvidence,
} from "@/src/lib/ai-image-relevance";
import type {
  ContentAgentBenefit,
  ContentAgentPackagePayload,
  ContentAgentRunResult,
} from "@/src/types/content-agent";

const DEFAULT_SOURCE_URL = "https://www.true.th/true-online";
const DEFAULT_MODEL = DEFAULT_PROMOTION_AGENT_MODEL;
const MAX_SOURCE_BYTES = 4 * 1024 * 1024;
const MAX_MODEL_SOURCE_CHARS = 180_000;
const LOCK_DURATION_MS = 10 * 60 * 1000;

type RawExtractedPackage = {
  name: string;
  type: string;
  downloadMbps: number;
  uploadMbps: number;
  price: number;
  priceNote: string | null;
  contractMonths: number | null;
  promoBadge: string | null;
  benefits: Array<{
    label: string;
    imageUrl: string | null;
  }>;
  imageUrl: string | null;
};

type ExtractedPayload = {
  packages: RawExtractedPackage[];
};

type SourceDocument = {
  text: string;
  fingerprint: string;
  imageEvidence: Map<string, SourceImageEvidence>;
};

function contentAgentDelegates() {
  const client = prisma as any;
  const config = client.contentAgentConfig;
  const run = client.contentAgentRun;
  const draft = client.contentAgentDraft;

  if (!config || !run || !draft) {
    throw new Error("Content Agent database tables are not ready. Run Prisma db push first.");
  }

  return { config, run, draft };
}

function stripEnvQuotes(value: string | undefined) {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "");
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

  const candidates = srcset
    .split(",")
    .map((item) => item.trim().split(/\s+/)[0])
    .filter(Boolean);

  return resolveHttpUrl(candidates.at(-1), sourceUrl);
}

function escapeMarkerValue(value: string) {
  return value.replace(/[\r\n\t]+/g, " ").replace(/"/g, "'");
}

function extractSourceImageCatalog(html: string, sourceUrl: string) {
  const matches =
    html.match(/https:\/\/images\.contentstack\.io\/[^"'\\\s<>)]+/g) || [];
  const images = new Map<string, string>();

  for (const match of matches) {
    const resolved = resolveHttpUrl(match.replace(/&amp;/g, "&"), sourceUrl);
    if (!resolved) continue;

    const url = new URL(resolved);
    if (
      url.hostname !== "images.contentstack.io" ||
      !/\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname) ||
      url.searchParams.has("width")
    ) {
      continue;
    }

    if (!images.has(url.pathname)) images.set(url.pathname, url.toString());
  }

  return Array.from(images.values()).slice(0, 160);
}

async function fetchSourceDocument(sourceUrl: string): Promise<SourceDocument> {
  if (!isAllowedTrueSource(sourceUrl)) {
    throw new Error("Source URL must use https://true.th or a true.th subdomain.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "TrueFiberHomeContentAgent/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`True.th returned HTTP ${response.status}.`);
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_SOURCE_BYTES) {
      throw new Error("Source page is larger than the allowed 4 MB.");
    }

    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > MAX_SOURCE_BYTES) {
      throw new Error("Source page is larger than the allowed 4 MB.");
    }

    const $ = load(html);
    const imageEvidence = new Map<string, SourceImageEvidence>();
    const sourceImageCatalog = extractSourceImageCatalog(html, sourceUrl);

    for (const imageUrl of sourceImageCatalog) {
      const fileName = decodeURIComponent(
        new URL(imageUrl).pathname.split("/").at(-1) || ""
      );
      imageEvidence.set(imageUrl, {
        url: imageUrl,
        alt: fileName,
        context: fileName,
      });
    }

    $("script, style, noscript, svg, iframe, header, footer").remove();
    $("br").replaceWith("\n");

    $("img").each((_, node) => {
      const element = $(node);
      const imageUrl = getImageCandidate(element as any, sourceUrl);
      const alt = escapeMarkerValue(element.attr("alt") || "");

      if (imageUrl) {
        const context = normalizeLabel(
          element
            .closest("article,section,li,div")
            .text()
            .slice(0, 500)
        );
        imageEvidence.set(imageUrl, { url: imageUrl, alt, context });
        element.replaceWith(`\n[IMAGE alt="${alt}" src="${imageUrl}"]\n`);
      } else {
        element.remove();
      }
    });

    $("a").each((_, node) => {
      const element = $(node);
      const href = resolveHttpUrl(element.attr("href"), sourceUrl);
      if (href) element.append(` [LINK href="${href}"]`);
    });

    $("h1,h2,h3,h4,h5,h6,p,li,section,article").each((_, node) => {
      $(node).prepend("\n").append("\n");
    });

    const root = $("main").length > 0 ? $("main") : $("body");
    const pageText = root
      .text()
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const imageCatalogText = Array.from(imageEvidence.values())
      .map(describeImageEvidence)
      .join("\n");
    const text = `${pageText}\n\nSOURCE IMAGE CATALOG\n${imageCatalogText}`.slice(
      0,
      MAX_MODEL_SOURCE_CHARS
    );

    if (text.length < 200) {
      throw new Error("Could not extract enough content from the source page.");
    }

    return {
      text,
      fingerprint: createHash("sha256").update(html).digest("hex"),
      imageEvidence,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildExtractionSchema(maxItems: number) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      packages: {
        type: "array",
        maxItems,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string", description: "Package name exactly as shown." },
            type: { type: "string", description: "Short package category, such as Netflix or Mesh WiFi." },
            downloadMbps: { type: "number", description: "Download speed in Mbps." },
            uploadMbps: { type: "number", description: "Upload speed in Mbps." },
            price: { type: "number", description: "Monthly package price in THB." },
            priceNote: { type: ["string", "null"], description: "VAT or discount note." },
            contractMonths: { type: ["number", "null"], description: "Contract duration in months." },
            promoBadge: { type: ["string", "null"], description: "Short promotion badge or special price note." },
            benefits: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  label: { type: "string" },
                  imageUrl: { type: ["string", "null"] },
                },
                required: ["label", "imageUrl"],
              },
            },
            imageUrl: {
              type: ["string", "null"],
              description:
                "The package header image URL from an IMAGE marker or clearly matching SOURCE_IMAGE filename.",
            },
          },
          required: [
            "name",
            "type",
            "downloadMbps",
            "uploadMbps",
            "price",
            "priceNote",
            "contractMonths",
            "promoBadge",
            "benefits",
            "imageUrl",
          ],
        },
      },
    },
    required: ["packages"],
  };
}

async function extractPackagesWithOpenRouter(
  sourceUrl: string,
  source: SourceDocument,
  model: string,
  maxItems: number
): Promise<RawExtractedPackage[]> {
  const apiKey = stripEnvQuotes(process.env.OPENROUTER_API_KEY);
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing.");
  }

  const baseUrl =
    stripEnvQuotes(process.env.OPENROUTER_BASE_URL) ||
    "https://openrouter.ai/api/v1";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50_000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://truefiberhome.com",
        "X-Title": "True Fiber Home Content Agent",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: [
              "You extract current TrueOnline home internet packages from authoritative source text.",
              "Return only packages explicitly present in the supplied source.",
              "Never invent prices, speeds, terms, benefits, links, or image URLs.",
              "Use an image URL only when the exact URL appears in an IMAGE marker or SOURCE_IMAGE marker.",
              "For package header images, use pack-card or package-card assets only when the filename, alt text, or nearby source copy names the same package.",
              "Never use logos, icons, badges, generic campaign backgrounds, or another package's artwork.",
              "When image evidence is ambiguous, return null instead of guessing.",
              "Keep Thai package names and benefit labels as written.",
              "Ignore navigation, FAQs, bill payment, troubleshooting, and existing-customer add-ons.",
            ].join(" "),
          },
          {
            role: "user",
            content: `Source URL: ${sourceUrl}\n\nExtract up to ${maxItems} current home internet packages from:\n\n${source.text}`,
          },
        ],
        temperature: 0,
        top_p: 0.1,
        max_tokens: 6_000,
        provider: {
          require_parameters: true,
        },
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "true_online_packages",
            strict: true,
            schema: buildExtractionSchema(maxItems),
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = (await response.text()).slice(0, 1_000);
      throw new Error(`OpenRouter returned HTTP ${response.status}: ${errorText}`);
    }

    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter returned an empty response.");

    const parsed = JSON.parse(content) as ExtractedPayload;
    if (!Array.isArray(parsed.packages)) {
      throw new Error("OpenRouter response did not contain a package array.");
    }

    return parsed.packages.slice(0, maxItems);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeLabel(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeNumber(value: unknown, max: number) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > max) return 0;
  return Math.round(number);
}

function normalizePackage(
  value: RawExtractedPackage,
  sourceUrl: string,
  imageEvidence: Map<string, SourceImageEvidence>
): ContentAgentPackagePayload | null {
  const name = normalizeLabel(value.name);
  const type = normalizeLabel(value.type) || "โปรเน็ตบ้าน";
  const downloadMbps = normalizeNumber(value.downloadMbps, 100_000);
  const uploadMbps = normalizeNumber(value.uploadMbps, 100_000);
  const price = normalizeNumber(value.price, 100_000);

  if (!name || !downloadMbps || !uploadMbps || !price) return null;

  const identity = `${name}|${downloadMbps}|${uploadMbps}|${price}`;
  const externalKey = createHash("sha256").update(identity).digest("hex").slice(0, 16);
  const imageUrl = resolveHttpUrl(value.imageUrl, sourceUrl);

  const benefits: ContentAgentBenefit[] = [];
  const benefitKeys = new Set<string>();

  for (const benefit of Array.isArray(value.benefits) ? value.benefits : []) {
    const label = normalizeLabel(benefit.label);
    if (!label) continue;

    const key = label.toLowerCase();
    if (benefitKeys.has(key)) continue;
    benefitKeys.add(key);

    const benefitImageUrl = resolveHttpUrl(benefit.imageUrl, sourceUrl);
    benefits.push({
      label,
      imageUrl:
        benefitImageUrl && imageEvidence.has(benefitImageUrl)
          ? benefitImageUrl
          : null,
    });
  }

  const imageReview =
    imageUrl && imageEvidence.has(imageUrl)
      ? scoreImageRelevance({
          evidence: imageEvidence.get(imageUrl)!,
          title: name,
          description: `${type} ${downloadMbps}/${uploadMbps} ${price}`,
          placement: "package-card",
        })
      : null;

  return {
    externalKey,
    code: `ai-true-${externalKey}`,
    name,
    type,
    downloadMbps,
    uploadMbps,
    speed: `${downloadMbps}/${uploadMbps}`,
    price,
    priceNote: normalizeLabel(value.priceNote) || null,
    contractMonths: normalizeNumber(value.contractMonths, 120) || null,
    promoBadge: normalizeLabel(value.promoBadge) || null,
    benefits,
    imageUrl:
      imageUrl &&
      imageReview?.accepted &&
      safeAssetUrl(imageUrl)
        ? imageUrl
        : null,
    sourceUrl,
  };
}

function packageFingerprint(payload: ContentAgentPackagePayload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function packageDetails(payload: ContentAgentPackagePayload) {
  return [
    ...payload.benefits.map((benefit) => benefit.label),
    payload.contractMonths ? `สัญญา ${payload.contractMonths} เดือน` : null,
    payload.priceNote,
    payload.promoBadge,
  ].filter((item): item is string => Boolean(item));
}

export async function ensureContentAgentConfig() {
  const { config } = contentAgentDelegates();
  return config.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      sourceUrl: DEFAULT_SOURCE_URL,
      model:
        process.env.PROMOTION_AGENT_MODEL ||
        process.env.CONTENT_AGENT_MODEL ||
        DEFAULT_MODEL,
    },
  });
}

export async function publishContentAgentPayload(
  payload: ContentAgentPackagePayload,
  displayOrder?: number
) {
  if (!payload.code.startsWith("ai-true-")) {
    throw new Error("Content Agent can publish only ai-true-* packages.");
  }

  const existing = await prisma.promotion.findUnique({
    where: { agentExternalKey: payload.externalKey },
  });

  const data = {
    type: "broadband",
    categoryName: payload.type,
    name: payload.name,
    price: payload.price,
    priceNote: payload.priceNote,
    speed: payload.speed,
    validity: payload.contractMonths
      ? `สัญญา ${payload.contractMonths} เดือน`
      : null,
    imageUrl: payload.imageUrl,
    promoBadge: payload.promoBadge,
    perks: payload.benefits,
    details: packageDetails(payload),
    buyUrl: null,
    status: true,
    sourceUrl: payload.sourceUrl,
    managedByAgent: true,
  };

  if (existing) {
    if (!existing.managedByAgent) {
      throw new Error("Refusing to update a promotion not managed by Content Agent.");
    }

    return prisma.promotion.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.promotion.create({
    data: {
      agentExternalKey: payload.externalKey,
      displayOrder: displayOrder ?? 100,
      ...data,
    },
  });
}

function revalidateContentAgentPaths() {
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/boardband");
  revalidatePath("/dashboard/home-content");
  revalidatePath("/dashboard/promotions");
  revalidatePath("/dashboard/content-agent");
}

export async function runContentAgent(
  trigger: "MANUAL" | "CRON"
): Promise<ContentAgentRunResult> {
  const { config, run, draft } = contentAgentDelegates();
  const settings = await ensureContentAgentConfig();

  if (trigger === "CRON" && !settings.enabled) {
    return {
      status: "SKIPPED",
      discoveredCount: 0,
      draftCount: 0,
      publishedCount: 0,
      message: "Automatic mode is disabled.",
    };
  }

  const lockToken = randomUUID();
  const now = new Date();
  const lockResult = await config.updateMany({
    where: {
      id: "singleton",
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
      message: "Another Content Agent run is still active.",
    };
  }

  const runRecord = await run.create({
    data: {
      trigger,
      sourceUrl: settings.sourceUrl,
      model: settings.model,
    },
  });

  try {
    const source = await fetchSourceDocument(settings.sourceUrl);
    const extracted = await extractPackagesWithOpenRouter(
      settings.sourceUrl,
      source,
      settings.model,
      settings.maxItems
    );

    const normalized = extracted
      .map((item) =>
        normalizePackage(item, settings.sourceUrl, source.imageEvidence)
      )
      .filter((item): item is ContentAgentPackagePayload => item !== null);

    const existingDrafts = await draft.findMany({
      where: {
        externalKey: { in: normalized.map((item) => item.externalKey) },
      },
      select: {
        externalKey: true,
        sourceFingerprint: true,
        status: true,
      },
    });

    const existingFingerprints = new Set(
      existingDrafts
        .filter((item: any) => item.status !== "REJECTED")
        .map((item: any) => `${item.externalKey}:${item.sourceFingerprint}`)
    );

    const maxOrder = await prisma.promotion.aggregate({
      _max: { displayOrder: true },
    });
    let nextOrder = (maxOrder._max.displayOrder ?? 0) + 1;
    let draftCount = 0;
    let publishedCount = 0;

    for (const payload of normalized) {
      const fingerprint = packageFingerprint(payload);
      if (existingFingerprints.has(`${payload.externalKey}:${fingerprint}`)) {
        continue;
      }

      const createdDraft = await draft.create({
        data: {
          runId: runRecord.id,
          externalKey: payload.externalKey,
          status: settings.autoPublish ? "AUTO_PUBLISHED" : "PENDING",
          title: payload.name,
          sourceUrl: payload.sourceUrl,
          imageUrl: payload.imageUrl,
          payload: payload as any,
          sourceFingerprint: fingerprint,
        },
      });
      draftCount += 1;

      if (settings.autoPublish) {
        const published = await publishContentAgentPayload(payload, nextOrder);
        nextOrder += 1;
        publishedCount += 1;

        await draft.update({
          where: { id: createdDraft.id },
          data: {
            publishedPromotionId: published.id,
            reviewedAt: new Date(),
          },
        });
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
        where: { id: "singleton" },
        data: {
          lastSuccessAt: new Date(),
          lastError: null,
        },
      }),
    ]);

    revalidateContentAgentPaths();

    return {
      runId: runRecord.id,
      status: "SUCCEEDED",
      discoveredCount: normalized.length,
      draftCount,
      publishedCount,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 2_000) : "Content Agent run failed.";

    await Promise.all([
      run.update({
        where: { id: runRecord.id },
        data: {
          status: "FAILED",
          errorMessage: message,
          finishedAt: new Date(),
        },
      }),
      config.update({
        where: { id: "singleton" },
        data: { lastError: message },
      }),
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
      where: { id: "singleton", lockToken },
      data: { lockToken: null, lockedUntil: null },
    });
  }
}

export async function approveContentAgentDraft(id: string) {
  const { draft } = contentAgentDelegates();
  const record = await draft.findUnique({ where: { id } });

  if (!record || record.status !== "PENDING") {
    throw new Error("Draft is not available for approval.");
  }

  const payload = record.payload as ContentAgentPackagePayload;
  const published = await publishContentAgentPayload(payload);

  await draft.update({
    where: { id },
    data: {
      status: "APPROVED",
      publishedPromotionId: published.id,
      reviewedAt: new Date(),
    },
  });

  revalidateContentAgentPaths();
  return published;
}

export async function rejectContentAgentDraft(id: string) {
  const { draft } = contentAgentDelegates();
  const result = await draft.updateMany({
    where: { id, status: "PENDING" },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    throw new Error("Draft is not available for rejection.");
  }

  revalidatePath("/dashboard/content-agent");
}
