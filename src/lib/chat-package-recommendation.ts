import { broadbandPackageData } from "@/src/data/boardband";
import { contactInfo } from "@/src/data/contact";
import { monthlyPackages } from "@/src/data/monthly";
import { promotionPackages } from "@/src/data/promotions";
import { topupPackages } from "@/src/data/topup";
import { prisma } from "@/src/lib/prisma";

type RecommendationCandidate = {
  key: string;
  name: string;
  price: number;
  speedText: string | null;
  downloadSpeedMbps: number | null;
  uploadSpeedMbps: number | null;
  contractMonths: number | null;
  quotaGb: number | null;
  unlimited: boolean;
  features: string[];
};

type PackageRequirements = {
  minSpeedMbps: number | null;
  minQuotaGb: number | null;
  requireUnlimited: boolean;
  maxContractMonths: number | null;
  exactContractMonths: number | null;
};

const PACKAGE_INTENT_PATTERN =
  /(แพ็กเกจ|แพคเกจ|โปรโมชั่น|โปรโมชัน|โปร|package|promotion|recommend|แนะนำ|งบ|budget|เน็ตบ้าน|ไฟเบอร์|fiber|wifi|ความเร็ว|mbps|gbps|รายเดือน|เติมเงิน|topup)/i;

const BUDGET_PATTERNS = [
  /(?:ไม่เกิน|งบ(?:ประมาณ)?|budget|under|ราคา(?:\s*ไม่เกิน)?|<=)\s*[:=]?\s*(?:บาท|฿)?\s*([0-9,]+(?:\.[0-9]+)?)/i,
  /([0-9,]+(?:\.[0-9]+)?)\s*บาท(?:\s*(?:หรือต่ำกว่า|หรือน้อยกว่า|ไม่เกิน))?/i,
  /<=\s*([0-9,]+(?:\.[0-9]+)?)/i,
  /฿\s*([0-9,]+(?:\.[0-9]+)?)/i,
];

const SPEED_REGEX = /(\d+(?:\.\d+)?)\s*(gbps|mbps|g|m)\b/gi;
const SPEED_PAIR_REGEX = /(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*(gbps|mbps|g|m)/gi;
const QUOTA_REGEX = /(\d+(?:\.\d+)?)\s*gb\b/gi;
const CONTRACT_REGEX = /(\d{1,2})\s*เดือน/g;
const UNLIMITED_REGEX = /(ไม่อั้น|ไม่จำกัด|unlimited)/i;

function toArabicDigits(value: string) {
  const thaiDigits = "๐๑๒๓๔๕๖๗๘๙";

  return value.replace(/[๐-๙]/g, (digit) => {
    const index = thaiDigits.indexOf(digit);
    return index >= 0 ? String(index) : digit;
  });
}

function compactText(value: string | null | undefined, maxLength = 220) {
  if (!value) {
    return null;
  }

  const compacted = value.replace(/\s+/g, " ").trim();
  if (!compacted) {
    return null;
  }

  return compacted.length <= maxLength ? compacted : `${compacted.slice(0, maxLength - 1)}…`;
}

function normalizeJsonText(value: unknown): string {
  if (value === null || typeof value === "undefined") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeJsonText(entry))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .join(" | ");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => {
        const text = normalizeJsonText(entry).trim();
        if (!text) {
          return "";
        }

        return `${key}: ${text}`;
      })
      .filter((entry) => entry.length > 0)
      .join(" | ");
  }

  return "";
}

function parseNumber(value: string) {
  const normalized = toArabicDigits(value).replace(/,/g, "").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBudget(question: string) {
  const normalizedQuestion = toArabicDigits(question);

  for (const pattern of BUDGET_PATTERNS) {
    const match = normalizedQuestion.match(pattern);
    if (!match || !match[1]) {
      continue;
    }

    const parsed = parseNumber(match[1]);
    if (parsed && parsed > 0) {
      return Math.floor(parsed);
    }
  }

  return null;
}

function toMbps(value: number, unit: string) {
  const lowered = unit.toLowerCase();
  if (lowered.startsWith("g")) {
    return value * 1000;
  }

  return value;
}

function extractSpeedFromTexts(texts: string[]) {
  let bestDownload: number | null = null;
  let bestUpload: number | null = null;
  let speedText: string | null = null;

  for (const text of texts) {
    let pairMatch = SPEED_PAIR_REGEX.exec(text);
    while (pairMatch) {
      const download = parseNumber(pairMatch[1]);
      const upload = parseNumber(pairMatch[2]);
      const unit = pairMatch[3]?.toLowerCase() || "mbps";

      if (download && upload) {
        const downloadMbps = toMbps(download, unit);
        const uploadMbps = toMbps(upload, unit);

        if (!bestDownload || downloadMbps > bestDownload) {
          bestDownload = downloadMbps;
          bestUpload = uploadMbps;
          speedText = `${download}/${upload} ${unit.toUpperCase()}`;
        }
      }

      pairMatch = SPEED_PAIR_REGEX.exec(text);
    }

    let singleMatch = SPEED_REGEX.exec(text);
    while (singleMatch) {
      const value = parseNumber(singleMatch[1]);
      const unit = singleMatch[2]?.toLowerCase() || "mbps";

      if (value) {
        const speedMbps = toMbps(value, unit);
        if (!bestDownload || speedMbps > bestDownload) {
          bestDownload = speedMbps;
          bestUpload = bestUpload ?? null;
          speedText = `${value} ${unit.toUpperCase()}`;
        }
      }

      singleMatch = SPEED_REGEX.exec(text);
    }
  }

  return {
    downloadSpeedMbps: bestDownload,
    uploadSpeedMbps: bestUpload,
    speedText,
  };
}

function extractQuotaFromTexts(texts: string[]) {
  let quotaGb: number | null = null;
  let unlimited = false;

  for (const text of texts) {
    if (UNLIMITED_REGEX.test(text)) {
      unlimited = true;
    }

    let match = QUOTA_REGEX.exec(text);
    while (match) {
      const quota = parseNumber(match[1]);
      if (quota && (!quotaGb || quota > quotaGb)) {
        quotaGb = quota;
      }
      match = QUOTA_REGEX.exec(text);
    }
  }

  return {
    quotaGb,
    unlimited,
  };
}

function extractContractMonthsFromTexts(texts: string[]) {
  let months: number | null = null;

  for (const text of texts) {
    let match = CONTRACT_REGEX.exec(text);
    while (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > 0 && (!months || parsed > months)) {
        months = parsed;
      }
      match = CONTRACT_REGEX.exec(text);
    }
  }

  return months;
}

function buildCandidate(input: {
  key: string;
  name: string;
  price: number;
  speedText?: string | null;
  downloadSpeedMbps?: number | null;
  uploadSpeedMbps?: number | null;
  contractMonths?: number | null;
  features?: Array<string | null | undefined>;
}) {
  const normalizedFeatures = (input.features ?? [])
    .map((feature) => compactText(feature ?? null))
    .filter((feature): feature is string => Boolean(feature));

  const speedInfoFromFeatures = extractSpeedFromTexts(normalizedFeatures);
  const speedText = compactText(input.speedText ?? speedInfoFromFeatures.speedText);

  const downloadSpeedMbps =
    input.downloadSpeedMbps ?? speedInfoFromFeatures.downloadSpeedMbps ?? null;
  const uploadSpeedMbps = input.uploadSpeedMbps ?? speedInfoFromFeatures.uploadSpeedMbps ?? null;

  const contractMonths =
    typeof input.contractMonths === "number" && input.contractMonths > 0
      ? input.contractMonths
      : extractContractMonthsFromTexts(normalizedFeatures);

  const quotaInfo = extractQuotaFromTexts(normalizedFeatures);

  return {
    key: input.key,
    name: compactText(input.name, 160) || input.name,
    price: Number(input.price),
    speedText,
    downloadSpeedMbps,
    uploadSpeedMbps,
    contractMonths,
    quotaGb: quotaInfo.quotaGb,
    unlimited: quotaInfo.unlimited,
    features: normalizedFeatures,
  } satisfies RecommendationCandidate;
}

function mergeCandidates(candidates: RecommendationCandidate[]) {
  const map = new Map<string, RecommendationCandidate>();

  for (const candidate of candidates) {
    if (!candidate.name || !Number.isFinite(candidate.price) || candidate.price <= 0) {
      continue;
    }

    const dedupeKey = `${candidate.name.toLowerCase().trim()}|${candidate.price.toFixed(2)}`;
    const existing = map.get(dedupeKey);

    if (!existing) {
      map.set(dedupeKey, candidate);
      continue;
    }

    const mergedFeatures = Array.from(new Set([...existing.features, ...candidate.features])).slice(0, 8);
    const merged = {
      ...existing,
      key: existing.key,
      speedText: existing.speedText ?? candidate.speedText,
      downloadSpeedMbps: existing.downloadSpeedMbps ?? candidate.downloadSpeedMbps,
      uploadSpeedMbps: existing.uploadSpeedMbps ?? candidate.uploadSpeedMbps,
      contractMonths: existing.contractMonths ?? candidate.contractMonths,
      quotaGb: existing.quotaGb ?? candidate.quotaGb,
      unlimited: existing.unlimited || candidate.unlimited,
      features: mergedFeatures,
    } satisfies RecommendationCandidate;

    map.set(dedupeKey, merged);
  }

  return Array.from(map.values());
}

function parseRequirements(question: string): PackageRequirements {
  const normalized = toArabicDigits(question).toLowerCase();
  const requirements: PackageRequirements = {
    minSpeedMbps: null,
    minQuotaGb: null,
    requireUnlimited: false,
    maxContractMonths: null,
    exactContractMonths: null,
  };

  if (UNLIMITED_REGEX.test(normalized)) {
    requirements.requireUnlimited = true;
  }

  const speedMatches = Array.from(normalized.matchAll(/(\d+(?:\.\d+)?)\s*(gbps|mbps|g|m)\b/gi));
  for (const match of speedMatches) {
    const value = parseNumber(match[1] ?? "");
    const unit = match[2] ?? "mbps";
    if (!value) {
      continue;
    }

    const speedMbps = toMbps(value, unit);
    if (!requirements.minSpeedMbps || speedMbps > requirements.minSpeedMbps) {
      requirements.minSpeedMbps = speedMbps;
    }
  }

  const quotaMatches = Array.from(normalized.matchAll(/(\d+(?:\.\d+)?)\s*gb\b/gi));
  for (const match of quotaMatches) {
    const value = parseNumber(match[1] ?? "");
    if (!value) {
      continue;
    }

    if (!requirements.minQuotaGb || value > requirements.minQuotaGb) {
      requirements.minQuotaGb = value;
    }
  }

  if (/(ไม่ติดสัญญา|ไม่มีสัญญา|no contract)/i.test(normalized)) {
    requirements.maxContractMonths = 0;
  } else {
    const maxContractMatch = normalized.match(
      /(?:สัญญา|contract|ติดสัญญา)[^\d]{0,16}(?:ไม่เกิน|สูงสุด|ไม่เกินที่)?\s*(\d{1,2})\s*เดือน/
    );

    if (maxContractMatch?.[1]) {
      const value = Number.parseInt(maxContractMatch[1], 10);
      if (Number.isFinite(value) && value >= 0) {
        requirements.maxContractMonths = value;
      }
    }

    const exactContractMatch = normalized.match(/(?:สัญญา|contract)\s*(\d{1,2})\s*เดือน/);
    if (exactContractMatch?.[1]) {
      const value = Number.parseInt(exactContractMatch[1], 10);
      if (Number.isFinite(value) && value > 0) {
        requirements.exactContractMonths = value;
      }
    }
  }

  return requirements;
}

function filterByRequirements(
  candidates: RecommendationCandidate[],
  requirements: PackageRequirements
): RecommendationCandidate[] {
  return candidates.filter((candidate) => {
    if (requirements.minSpeedMbps !== null) {
      if (!candidate.downloadSpeedMbps || candidate.downloadSpeedMbps < requirements.minSpeedMbps) {
        return false;
      }
    }

    if (requirements.requireUnlimited && !candidate.unlimited) {
      return false;
    }

    if (requirements.minQuotaGb !== null) {
      const hasEnoughQuota = candidate.unlimited || (candidate.quotaGb !== null && candidate.quotaGb >= requirements.minQuotaGb);
      if (!hasEnoughQuota) {
        return false;
      }
    }

    if (requirements.maxContractMonths !== null) {
      if (candidate.contractMonths === null || candidate.contractMonths > requirements.maxContractMonths) {
        return false;
      }
    }

    if (requirements.exactContractMonths !== null) {
      if (candidate.contractMonths === null || candidate.contractMonths !== requirements.exactContractMonths) {
        return false;
      }
    }

    return true;
  });
}

function valueScore(candidate: RecommendationCandidate) {
  let score = 0;

  if (candidate.downloadSpeedMbps && candidate.downloadSpeedMbps > 0) {
    score += (candidate.downloadSpeedMbps / candidate.price) * 3;
  }

  if (candidate.quotaGb && candidate.quotaGb > 0) {
    score += candidate.quotaGb / candidate.price;
  }

  if (candidate.unlimited) {
    score += 1.2;
  }

  if (candidate.features.length > 0) {
    score += Math.min(candidate.features.length, 4) * 0.25;
  }

  score += Math.max(0, 1 - candidate.price / 1000);

  return score;
}

function rankCandidates(candidates: RecommendationCandidate[]) {
  return candidates.slice().sort((left, right) => {
    const scoreDiff = valueScore(right) - valueScore(left);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    if (left.price !== right.price) {
      return left.price - right.price;
    }

    return left.name.localeCompare(right.name, "th");
  });
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildBenefitText(candidate: RecommendationCandidate) {
  const parts: string[] = [];

  if (candidate.speedText) {
    parts.push(`ความเร็ว ${candidate.speedText}`);
  }

  if (candidate.quotaGb) {
    parts.push(`โควตา ${formatMoney(candidate.quotaGb)} GB`);
  } else if (candidate.unlimited) {
    parts.push("อินเทอร์เน็ตไม่จำกัด");
  }

  if (candidate.contractMonths !== null) {
    parts.push(`สัญญา ${candidate.contractMonths} เดือน`);
  }

  for (const feature of candidate.features) {
    const lowered = feature.toLowerCase();
    if (parts.length >= 4) {
      break;
    }

    if (/(ราคา|บาท|ลิงก์|link|buy)/i.test(lowered)) {
      continue;
    }

    if (parts.some((part) => part.includes(feature))) {
      continue;
    }

    parts.push(feature);
  }

  if (parts.length === 0) {
    return "รายละเอียดตามข้อมูลในระบบ";
  }

  return parts.slice(0, 4).join(" | ");
}

function formatRecommendationTable(budget: number, candidates: RecommendationCandidate[]) {
  const rows = candidates.slice(0, 3).map((candidate, index) => {
    return `| ${index + 1} | ${candidate.name} | ${formatMoney(candidate.price)} บาท | ${buildBenefitText(candidate)} |`;
  });

  return [
    `**แพ็กเกจที่แนะนำสำหรับงบ ${formatMoney(budget)} บาท:**`,
    "",
    "| # | ชื่อแพ็กเกจ | ราคา | สิ่งที่ได้ |",
    "|---|---|---|---|",
    ...rows,
    "",
    "📌 หมายเหตุ: คัดเฉพาะแพ็กเกจที่ราคาไม่เกินงบและข้อมูลมาจากแพ็กเกจในระบบเท่านั้น",
  ].join("\n");
}

function getNoBudgetMatchReply(budget: number) {
  return `ไม่พบแพ็กเกจในงบ ${formatMoney(budget)} บาท กรุณาระบุงบใหม่หรือต้องการดูตัวเลือกใกล้เคียงไหมครับ?`;
}

function getNoDataReply() {
  const contact = contactInfo.socialLinks[0]?.href || contactInfo.phone;
  return `ขออภัย ไม่พบข้อมูลในระบบ กรุณาติดต่อเจ้าหน้าที่ที่ ${contact}`;
}

function isPackageRecommendationIntent(question: string) {
  const normalized = question.trim();
  if (!normalized) {
    return false;
  }

  if (PACKAGE_INTENT_PATTERN.test(normalized)) {
    return true;
  }

  return parseBudget(normalized) !== null;
}

async function loadRecommendationCandidates() {
  const candidates: RecommendationCandidate[] = [];

  try {
    const [categories, packages, promotions] = await Promise.all([
      prisma.packageCategory.findMany({
        where: { isActive: true },
        include: {
          items: {
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
          },
        },
        orderBy: { id: "asc" },
      }),
      prisma.package.findMany({
        where: { status: true },
        orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.promotion.findMany({
        where: { status: true },
        orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
      }),
    ]);

    for (const category of categories) {
      for (const item of category.items) {
        const speedText =
          typeof item.downloadSpeed === "number" && typeof item.uploadSpeed === "number"
            ? `${item.downloadSpeed}/${item.uploadSpeed} ${item.speedUnit}`
            : typeof item.downloadSpeed === "number"
              ? `${item.downloadSpeed} ${item.speedUnit}`
              : typeof item.uploadSpeed === "number"
                ? `${item.uploadSpeed} ${item.speedUnit}`
                : null;

        candidates.push(
          buildCandidate({
            key: `db-item-${item.id}`,
            name: item.name,
            price: item.price,
            speedText,
            downloadSpeedMbps: item.downloadSpeed,
            uploadSpeedMbps: item.uploadSpeed,
            contractMonths: item.contractMonths,
            features: [
              category.name,
              item.priceNote,
              item.description,
              item.promoBadge,
              normalizeJsonText(item.perks),
              normalizeJsonText(item.freebies),
            ],
          })
        );
      }
    }

    for (const item of packages) {
      candidates.push(
        buildCandidate({
          key: `db-package-${item.id}`,
          name: item.name,
          price: item.price,
          speedText: item.speed,
          features: [item.type, item.speed, normalizeJsonText(item.details), normalizeJsonText(item.freebie)],
        })
      );
    }

    for (const item of promotions) {
      candidates.push(
        buildCandidate({
          key: `db-promo-${item.id}`,
          name: item.name,
          price: item.price,
          speedText: item.speed,
          features: [
            item.type,
            item.categoryName,
            item.priceNote,
            item.speed,
            item.validity,
            item.promoBadge,
            normalizeJsonText(item.details),
            normalizeJsonText(item.perks),
          ],
        })
      );
    }
  } catch (error) {
    console.error("Failed to load package data from database:", error);
  }

  const staticPackages = [
    ...broadbandPackageData,
    ...promotionPackages,
    ...monthlyPackages,
    ...topupPackages,
  ].filter((item) => item.is_active !== false);

  for (const item of staticPackages) {
    const speedText =
      typeof item.download_speed === "number" && typeof item.upload_speed === "number"
        ? `${item.download_speed}/${item.upload_speed} ${item.speed_unit || "Mbps"}`
        : typeof item.download_speed === "number"
          ? `${item.download_speed} ${item.speed_unit || "Mbps"}`
          : typeof item.upload_speed === "number"
            ? `${item.upload_speed} ${item.speed_unit || "Mbps"}`
            : item.speed || null;

    candidates.push(
      buildCandidate({
        key: `static-${item.id}-${item.name}`,
        name: item.name,
        price: item.price,
        speedText,
        downloadSpeedMbps: item.download_speed ?? null,
        uploadSpeedMbps: item.upload_speed ?? null,
        contractMonths: item.contract_months ?? null,
        features: [
          item.price_note,
          item.description,
          item.promo_badge,
          normalizeJsonText(item.perks),
          normalizeJsonText(item.freebies),
        ],
      })
    );
  }

  return mergeCandidates(candidates);
}

export async function tryGeneratePackageRecommendationReply(question: string) {
  if (!isPackageRecommendationIntent(question)) {
    return null;
  }

  const budget = parseBudget(question);
  if (budget === null) {
    return "กรุณาระบุงบประมาณ เช่น ไม่เกิน 500 บาท เพื่อให้แนะนำแพ็กเกจได้ตรงความต้องการครับ";
  }

  const allCandidates = await loadRecommendationCandidates();
  if (allCandidates.length === 0) {
    return getNoDataReply();
  }

  const budgetFiltered = allCandidates.filter((candidate) => candidate.price <= budget);
  if (budgetFiltered.length === 0) {
    return getNoBudgetMatchReply(budget);
  }

  const requirements = parseRequirements(question);
  const requirementFiltered = filterByRequirements(budgetFiltered, requirements);

  if (requirementFiltered.length === 0) {
    return `ไม่พบแพ็กเกจที่ตรงเงื่อนไขทั้งหมดในงบ ${formatMoney(budget)} บาท กรุณาปรับเงื่อนไขหรือเพิ่มงบประมาณครับ`;
  }

  const ranked = rankCandidates(requirementFiltered).slice(0, 3);
  if (ranked.length === 0) {
    return getNoDataReply();
  }

  return formatRecommendationTable(budget, ranked);
}
