import { broadbandPackageData } from "@/src/data/boardband";
import { monthlyPackages } from "@/src/data/monthly";
import { promotionPackages } from "@/src/data/promotions";
import { topupPackages } from "@/src/data/topup";
import { prisma } from "@/src/lib/prisma";

type PackageSegment = "home" | "mobile" | "other";

type Candidate = {
  key: string;
  name: string;
  price: number;
  segment: PackageSegment;
  speedText: string | null;
  downloadSpeedMbps: number | null;
  contractMonths: number | null;
  unlimited: boolean;
  quotaGb: number | null;
  benefits: string[];
};

type Requirements = {
  budget: number;
  requestedSegment: PackageSegment | null;
  minSpeedMbps: number | null;
  minQuotaGb: number | null;
  requireUnlimited: boolean;
  maxContractMonths: number | null;
};

const PACKAGE_INTENT_PATTERN =
  /(แพ็กเกจ|แพคเกจ|โปรโมชั่น|โปรโมชัน|โปร|package|promotion|recommend|แนะนำ|งบ|budget|เน็ตบ้าน|ไฟเบอร์|fiber|wifi|broadband|มือถือ|topup|เติมเงิน|รายเดือน|5g|4g)/i;

const HOME_SEGMENT_PATTERN = /(เน็ตบ้าน|ไฟเบอร์|fiber|wifi|broadband|home\s*internet)/i;
const MOBILE_SEGMENT_PATTERN = /(มือถือ|mobile|ซิม|sim|เติมเงิน|topup|รายเดือน|monthly|5g|4g)/i;

const BUDGET_PATTERNS = [
  /(?:ไม่เกิน|งบ(?:ประมาณ)?|budget|under|ราคา(?:\s*ไม่เกิน)?|<=)\s*[:=]?\s*(?:บาท|฿)?\s*([0-9,]+(?:\.[0-9]+)?)/i,
  /([0-9,]+(?:\.[0-9]+)?)\s*บาท(?:\s*(?:หรือต่ำกว่า|หรือน้อยกว่า|ไม่เกิน))?/i,
  /<=\s*([0-9,]+(?:\.[0-9]+)?)/i,
  /฿\s*([0-9,]+(?:\.[0-9]+)?)/i,
];

function toArabicDigits(value: string) {
  const thaiDigits = "๐๑๒๓๔๕๖๗๘๙";

  return value.replace(/[๐-๙]/g, (digit) => {
    const index = thaiDigits.indexOf(digit);
    return index >= 0 ? String(index) : digit;
  });
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
    if (!match?.[1]) {
      continue;
    }

    const parsed = parseNumber(match[1]);
    if (parsed !== null && parsed > 0) {
      return Math.floor(parsed);
    }
  }

  return null;
}

function toMbps(value: number, unit: string) {
  return unit.toLowerCase().startsWith("g") ? value * 1000 : value;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function compactText(value: string | null | undefined, maxLength = 180) {
  if (!value) {
    return null;
  }

  const compacted = value
    .replace(/https?:\/\/[^\s)]+/gi, "")
    .replace(/\s+/g, " ")
    .replace(/[|]+/g, ", ")
    .trim();

  if (!compacted) {
    return null;
  }

  return compacted.length <= maxLength ? compacted : `${compacted.slice(0, maxLength - 1)}…`;
}

function inferSegment(texts: Array<string | null | undefined>, fallback: PackageSegment = "other") {
  const joined = texts
    .map((text) => compactText(text, 220))
    .filter((text): text is string => Boolean(text))
    .join(" ");

  if (HOME_SEGMENT_PATTERN.test(joined)) {
    return "home";
  }

  if (MOBILE_SEGMENT_PATTERN.test(joined)) {
    return "mobile";
  }

  return fallback;
}

function detectRequestedSegment(question: string): PackageSegment | null {
  const hasHome = HOME_SEGMENT_PATTERN.test(question);
  const hasMobile = MOBILE_SEGMENT_PATTERN.test(question);

  if (hasHome && !hasMobile) {
    return "home";
  }

  if (hasMobile && !hasHome) {
    return "mobile";
  }

  return null;
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
      .map((entry) => normalizeJsonText(entry).trim())
      .filter((entry) => entry.length > 0)
      .join(" | ");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferredKeys = ["text", "label", "title", "name", "description", "detail", "speed", "validity"];

    const preferredValues = preferredKeys
      .map((key) => normalizeJsonText(record[key]).trim())
      .filter((entry) => entry.length > 0);

    if (preferredValues.length > 0) {
      return preferredValues.join(" | ");
    }

    return Object.values(record)
      .map((entry) => normalizeJsonText(entry).trim())
      .filter((entry) => entry.length > 0)
      .join(" | ");
  }

  return "";
}

function extractBenefits(values: Array<string | null | undefined>) {
  const benefits: string[] = [];

  for (const value of values) {
    const compacted = compactText(value, 160);
    if (!compacted) {
      continue;
    }

    const lowered = compacted.toLowerCase();
    if (/(https?:\/\/|\.supabase\.co|image|icon|label:|text:|buy|link|ลิงก์|url)/i.test(lowered)) {
      continue;
    }

    if (/(^|\s)(บาท|ราคา)(\s|$)/i.test(lowered)) {
      continue;
    }

    if (!benefits.includes(compacted)) {
      benefits.push(compacted);
    }

    if (benefits.length >= 4) {
      break;
    }
  }

  return benefits;
}

function buildCandidate(input: {
  key: string;
  name: string;
  price: number;
  segment: PackageSegment;
  speedText?: string | null;
  downloadSpeedMbps?: number | null;
  contractMonths?: number | null;
  benefits?: Array<string | null | undefined>;
}) {
  const name = compactText(input.name, 120);
  if (!name) {
    return null;
  }

  const price = Number(input.price);
  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  const speedText = compactText(input.speedText, 60);
  const rawBenefits = extractBenefits(input.benefits ?? []);

  let quotaGb: number | null = null;
  let unlimited = false;

  for (const benefit of rawBenefits) {
    if (/(ไม่อั้น|ไม่จำกัด|unlimited)/i.test(benefit)) {
      unlimited = true;
    }

    const quotaMatch = benefit.match(/(\d+(?:\.\d+)?)\s*gb\b/i);
    if (quotaMatch?.[1]) {
      const quota = parseNumber(quotaMatch[1]);
      if (quota !== null && (quotaGb === null || quota > quotaGb)) {
        quotaGb = quota;
      }
    }
  }

  return {
    key: input.key,
    name,
    price,
    segment: input.segment,
    speedText,
    downloadSpeedMbps: input.downloadSpeedMbps ?? null,
    contractMonths:
      typeof input.contractMonths === "number" && input.contractMonths > 0
        ? input.contractMonths
        : null,
    unlimited,
    quotaGb,
    benefits: rawBenefits,
  } satisfies Candidate;
}

function dedupeCandidates(candidates: Candidate[]) {
  const map = new Map<string, Candidate>();

  for (const candidate of candidates) {
    const key = `${candidate.name.toLowerCase()}|${candidate.price.toFixed(2)}|${candidate.segment}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, candidate);
      continue;
    }

    map.set(key, {
      ...existing,
      speedText: existing.speedText ?? candidate.speedText,
      downloadSpeedMbps: existing.downloadSpeedMbps ?? candidate.downloadSpeedMbps,
      contractMonths: existing.contractMonths ?? candidate.contractMonths,
      unlimited: existing.unlimited || candidate.unlimited,
      quotaGb: existing.quotaGb ?? candidate.quotaGb,
      benefits: Array.from(new Set([...existing.benefits, ...candidate.benefits])).slice(0, 4),
    });
  }

  return Array.from(map.values());
}

function parseRequirements(question: string): Requirements | null {
  const budget = parseBudget(question);
  if (budget === null) {
    return null;
  }

  const normalized = toArabicDigits(question).toLowerCase();
  let minSpeedMbps: number | null = null;
  let minQuotaGb: number | null = null;

  const speedMatches = Array.from(normalized.matchAll(/(\d+(?:\.\d+)?)\s*(gbps|mbps|g|m)\b/gi));
  for (const match of speedMatches) {
    const value = parseNumber(match[1] ?? "");
    const unit = match[2] ?? "mbps";

    if (value === null) {
      continue;
    }

    const speedMbps = toMbps(value, unit);
    if (minSpeedMbps === null || speedMbps > minSpeedMbps) {
      minSpeedMbps = speedMbps;
    }
  }

  const quotaMatches = Array.from(normalized.matchAll(/(\d+(?:\.\d+)?)\s*gb\b/gi));
  for (const match of quotaMatches) {
    const value = parseNumber(match[1] ?? "");
    if (value === null) {
      continue;
    }

    if (minQuotaGb === null || value > minQuotaGb) {
      minQuotaGb = value;
    }
  }

  let maxContractMonths: number | null = null;
  if (/(ไม่ติดสัญญา|ไม่มีสัญญา|no contract)/i.test(normalized)) {
    maxContractMonths = 0;
  } else {
    const contractMatch = normalized.match(/(?:สัญญา|contract|ติดสัญญา)[^\d]{0,16}(\d{1,2})\s*เดือน/i);
    if (contractMatch?.[1]) {
      const parsed = Number.parseInt(contractMatch[1], 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        maxContractMonths = parsed;
      }
    }
  }

  return {
    budget,
    requestedSegment: detectRequestedSegment(question),
    minSpeedMbps,
    minQuotaGb,
    requireUnlimited: /(ไม่อั้น|ไม่จำกัด|unlimited)/i.test(normalized),
    maxContractMonths,
  };
}

function filterCandidates(candidates: Candidate[], requirements: Requirements) {
  return candidates.filter((candidate) => {
    if (candidate.price > requirements.budget) {
      return false;
    }

    if (requirements.requestedSegment && candidate.segment !== requirements.requestedSegment) {
      return false;
    }

    if (requirements.minSpeedMbps !== null) {
      if (candidate.downloadSpeedMbps === null || candidate.downloadSpeedMbps < requirements.minSpeedMbps) {
        return false;
      }
    }

    if (requirements.requireUnlimited && !candidate.unlimited) {
      return false;
    }

    if (requirements.minQuotaGb !== null) {
      const quotaPass = candidate.unlimited || (candidate.quotaGb !== null && candidate.quotaGb >= requirements.minQuotaGb);
      if (!quotaPass) {
        return false;
      }
    }

    if (requirements.maxContractMonths !== null) {
      if (candidate.contractMonths === null || candidate.contractMonths > requirements.maxContractMonths) {
        return false;
      }
    }

    return true;
  });
}

function valueScore(candidate: Candidate) {
  let score = 0;

  if (candidate.downloadSpeedMbps && candidate.downloadSpeedMbps > 0) {
    score += candidate.downloadSpeedMbps / candidate.price;
  }

  if (candidate.quotaGb && candidate.quotaGb > 0) {
    score += candidate.quotaGb / Math.max(candidate.price, 1);
  }

  if (candidate.unlimited) {
    score += 0.8;
  }

  score += Math.max(0, 1 - candidate.price / 1000);
  score += Math.min(candidate.benefits.length, 2) * 0.2;

  return score;
}

function rankCandidates(candidates: Candidate[]) {
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

function formatCandidateLine(candidate: Candidate, index: number) {
  const details: string[] = [];

  if (candidate.speedText) {
    details.push(`ความเร็ว ${candidate.speedText}`);
  }

  if (candidate.unlimited) {
    details.push("เน็ตไม่จำกัด");
  } else if (candidate.quotaGb !== null) {
    details.push(`โควตา ${formatMoney(candidate.quotaGb)}GB`);
  }

  if (candidate.contractMonths !== null) {
    details.push(`สัญญา ${candidate.contractMonths} เดือน`);
  }

  for (const benefit of candidate.benefits) {
    if (details.length >= 3) {
      break;
    }

    if (!details.includes(benefit)) {
      details.push(benefit);
    }
  }

  const summary = details.length > 0 ? details.join(" | ") : "รายละเอียดตามข้อมูลในระบบ";
  return `${index + 1}. ${candidate.name} - ${formatMoney(candidate.price)} บาท (${summary})`;
}

function formatRecommendationReply(requirements: Requirements, candidates: Candidate[]) {
  const segmentText =
    requirements.requestedSegment === "home"
      ? " เน็ตบ้าน"
      : requirements.requestedSegment === "mobile"
        ? " เน็ตมือถือ"
        : "";

  const lines = [
    `งบไม่เกิน ${formatMoney(requirements.budget)} บาท${segmentText}`,
    ...candidates.slice(0, 3).map((candidate, index) => formatCandidateLine(candidate, index)),
  ];

  return lines.join("\n");
}

function getNoBudgetMatchReply(budget: number) {
  return `ไม่พบแพ็กเกจในงบ ${formatMoney(budget)} บาท กรุณาระบุงบใหม่หรือต้องการดูตัวเลือกใกล้เคียงไหมครับ?`;
}

function getNoDataReply() {
  return "ขออภัย ไม่พบข้อมูลในระบบ กรุณาติดต่อเจ้าหน้าที่ที่ [contact]";
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

async function loadCandidates() {
  const candidates: Candidate[] = [];

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
              : null;

        const segment = inferSegment([category.name, category.slug, item.name], "other");

        const candidate = buildCandidate({
          key: `db-item-${item.id}`,
          name: item.name,
          price: item.price,
          segment,
          speedText,
          downloadSpeedMbps: item.downloadSpeed,
          contractMonths: item.contractMonths,
          benefits: [
            item.description,
            item.priceNote,
            item.promoBadge,
            normalizeJsonText(item.perks),
            normalizeJsonText(item.freebies),
          ],
        });

        if (candidate) {
          candidates.push(candidate);
        }
      }
    }

    for (const item of packages) {
      const segment = inferSegment([item.type, item.name, item.speed], "other");
      const candidate = buildCandidate({
        key: `db-package-${item.id}`,
        name: item.name,
        price: item.price,
        segment,
        speedText: item.speed,
        benefits: [item.type, normalizeJsonText(item.details), normalizeJsonText(item.freebie)],
      });

      if (candidate) {
        candidates.push(candidate);
      }
    }

    for (const item of promotions) {
      const segment = inferSegment([item.type, item.categoryName, item.name, item.speed], "other");
      const candidate = buildCandidate({
        key: `db-promotion-${item.id}`,
        name: item.name,
        price: item.price,
        segment,
        speedText: item.speed,
        benefits: [
          item.priceNote,
          item.validity,
          item.promoBadge,
          normalizeJsonText(item.details),
          normalizeJsonText(item.perks),
        ],
      });

      if (candidate) {
        candidates.push(candidate);
      }
    }
  } catch (error) {
    console.error("Failed to load package data from database:", error);
  }

  for (const item of broadbandPackageData.filter((pkg) => pkg.is_active !== false)) {
    const speedText =
      typeof item.download_speed === "number" && typeof item.upload_speed === "number"
        ? `${item.download_speed}/${item.upload_speed} ${item.speed_unit || "Mbps"}`
        : null;

    const candidate = buildCandidate({
      key: `static-broadband-${item.id}`,
      name: item.name,
      price: item.price,
      segment: "home",
      speedText,
      downloadSpeedMbps: item.download_speed ?? null,
      contractMonths: item.contract_months ?? null,
      benefits: [
        item.description,
        item.price_note,
        item.promo_badge,
        normalizeJsonText(item.perks),
        normalizeJsonText(item.freebies),
      ],
    });

    if (candidate) {
      candidates.push(candidate);
    }
  }

  for (const item of promotionPackages.filter((pkg) => pkg.is_active !== false)) {
    const speedText =
      typeof item.download_speed === "number" && typeof item.upload_speed === "number"
        ? `${item.download_speed}/${item.upload_speed} ${item.speed_unit || "Mbps"}`
        : item.speed || null;

    const candidate = buildCandidate({
      key: `static-promotion-${item.id}`,
      name: item.name,
      price: item.price,
      segment: item.category_id === 1 ? "home" : "mobile",
      speedText,
      downloadSpeedMbps: item.download_speed ?? null,
      contractMonths: item.contract_months ?? null,
      benefits: [
        item.description,
        item.price_note,
        item.promo_badge,
        normalizeJsonText(item.perks),
        normalizeJsonText(item.freebies),
      ],
    });

    if (candidate) {
      candidates.push(candidate);
    }
  }

  for (const item of monthlyPackages.filter((pkg) => pkg.is_active !== false)) {
    const candidate = buildCandidate({
      key: `static-monthly-${item.id}`,
      name: item.name,
      price: item.price,
      segment: "mobile",
      speedText: item.speed || null,
      downloadSpeedMbps: item.download_speed ?? null,
      contractMonths: item.contract_months ?? null,
      benefits: [
        item.description,
        item.price_note,
        item.promo_badge,
        normalizeJsonText(item.perks),
        normalizeJsonText(item.freebies),
      ],
    });

    if (candidate) {
      candidates.push(candidate);
    }
  }

  for (const item of topupPackages.filter((pkg) => pkg.is_active !== false)) {
    const candidate = buildCandidate({
      key: `static-topup-${item.id}`,
      name: item.name,
      price: item.price,
      segment: "mobile",
      speedText: item.speed || null,
      downloadSpeedMbps: item.download_speed ?? null,
      contractMonths: item.contract_months ?? null,
      benefits: [
        item.description,
        item.price_note,
        item.promo_badge,
        normalizeJsonText(item.perks),
        normalizeJsonText(item.freebies),
      ],
    });

    if (candidate) {
      candidates.push(candidate);
    }
  }

  return dedupeCandidates(candidates);
}

export async function tryGeneratePackageRecommendationReply(question: string) {
  if (!isPackageRecommendationIntent(question)) {
    return null;
  }

  const requirements = parseRequirements(question);
  if (!requirements) {
    return "กรุณาระบุงบประมาณ เช่น ไม่เกิน 500 บาท เพื่อให้แนะนำแพ็กเกจได้ตรงความต้องการครับ";
  }

  const allCandidates = await loadCandidates();
  if (allCandidates.length === 0) {
    return getNoDataReply();
  }

  const filtered = filterCandidates(allCandidates, requirements);
  if (filtered.length === 0) {
    return getNoBudgetMatchReply(requirements.budget);
  }

  const ranked = rankCandidates(filtered).slice(0, 3);
  if (ranked.length === 0) {
    return getNoDataReply();
  }

  return formatRecommendationReply(requirements, ranked);
}
