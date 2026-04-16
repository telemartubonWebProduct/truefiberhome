import type { Metadata } from "next";
import { prisma } from "@/src/lib/prisma";
import { knowledgeArticles, solarBanner, solarProductInfo } from "@/src/data/solar";
import { solarcellPackages } from "@/src/data/solar";
import WEnergyClient from "./components/WEnergyClient";
import type { SolarPlan, WEnergyKnowledgeItem, WEnergyPageContent } from "./types";

export const metadata: Metadata = {
  title: "โซล่าเซลล์พลังงานสะอาด | W&W Energy",
  description: "บริการติดตั้งโซล่าเซลล์ครบวงจร พร้อมแพ็กเกจที่อัปเดตจากหลังบ้านแบบเรียลไทม์",
  alternates: { canonical: "/wEnergy" },
};

export const revalidate = 0;

type SectionRecord = {
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  jsonData: unknown;
};

function asText(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed || fallback;
}

function buildDefaultKnowledgeItems(): WEnergyKnowledgeItem[] {
  return knowledgeArticles.slice(0, 3).map((item) => ({
    title: item.title,
    content: item.content,
    imageSrc: item.imageSrc,
    imageAlt: item.imageAlt,
  }));
}

function getDefaultContent(): WEnergyPageContent {
  const productDesc = typeof solarProductInfo.description === "string" ? solarProductInfo.description : "";

  return {
    heroTagline: "W&W Energy",
    heroTitle: "ติดตั้งโซล่าเซลล์ครบวงจร",
    heroSubtitle:
      "โซลูชันสำหรับบ้านและธุรกิจ ออกแบบโดยทีมวิศวกร พร้อมบริการสำรวจหน้างาน ติดตั้ง และดูแลหลังการขายในมาตรฐานเดียวกันทุกโปรเจกต์",
    heroImageUrl: solarBanner[0]?.image || "",
    heroPrimaryCtaLabel: "ปรึกษาฟรี",
    heroPrimaryCtaUrl: "",
    heroSecondaryCtaLabel: "ดูแพ็กเกจ",
    productTitle: solarProductInfo.title,
    productSubtitle: solarProductInfo.subtitle,
    productDescription: productDesc,
    productPhone: solarProductInfo.contactPhone,
    productImageUrl: solarProductInfo.imageSrc,
    packageSectionTitle: "แพ็กเกจแนะนำ",
    packageSectionSubtitle: "ปรับราคาได้จากหลังบ้าน dashboard และอัปเดตขึ้นหน้านี้อัตโนมัติ",
    knowledgeTitle: "ความรู้พื้นฐานก่อนติดตั้ง",
    knowledgeSubtitle: "สรุปประเด็นสำคัญที่ควรรู้ก่อนตัดสินใจติดตั้งระบบโซล่าเซลล์",
    knowledgeItems: buildDefaultKnowledgeItems(),
  };
}

function normalizeKnowledgeItems(value: unknown, fallbackItems: WEnergyKnowledgeItem[]): WEnergyKnowledgeItem[] {
  if (!Array.isArray(value)) {
    return fallbackItems;
  }

  const parsed = value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const data = item as Record<string, unknown>;
      const fallback = fallbackItems[index] || fallbackItems[0];
      if (!fallback) {
        return null;
      }

      return {
        title: asText(data.title, fallback.title),
        content: asText(data.content, fallback.content),
        imageSrc: asText(data.imageSrc, fallback.imageSrc),
        imageAlt: asText(data.imageAlt, fallback.imageAlt),
      };
    })
    .filter((item): item is WEnergyKnowledgeItem => Boolean(item));

  return parsed.length > 0 ? parsed : fallbackItems;
}

function getWEnergyContent(section: SectionRecord | null): WEnergyPageContent {
  const defaults = getDefaultContent();

  if (!section) {
    return defaults;
  }

  const jsonData =
    section.jsonData && typeof section.jsonData === "object" && !Array.isArray(section.jsonData)
      ? (section.jsonData as Record<string, unknown>)
      : {};

  return {
    heroTagline: asText(jsonData.heroTagline, defaults.heroTagline),
    heroTitle: asText(section.title, defaults.heroTitle),
    heroSubtitle: asText(section.subtitle, defaults.heroSubtitle),
    heroImageUrl: asText(section.imageUrl, defaults.heroImageUrl),
    heroPrimaryCtaLabel: asText(jsonData.heroPrimaryCtaLabel, defaults.heroPrimaryCtaLabel),
    heroPrimaryCtaUrl: asText(jsonData.heroPrimaryCtaUrl, defaults.heroPrimaryCtaUrl),
    heroSecondaryCtaLabel: asText(jsonData.heroSecondaryCtaLabel, defaults.heroSecondaryCtaLabel),
    productTitle: asText(jsonData.productTitle, defaults.productTitle),
    productSubtitle: asText(jsonData.productSubtitle, defaults.productSubtitle),
    productDescription: asText(jsonData.productDescription, defaults.productDescription),
    productPhone: asText(jsonData.productPhone, defaults.productPhone),
    productImageUrl: asText(section.linkUrl, defaults.productImageUrl),
    packageSectionTitle: asText(jsonData.packageSectionTitle, defaults.packageSectionTitle),
    packageSectionSubtitle: asText(jsonData.packageSectionSubtitle, defaults.packageSectionSubtitle),
    knowledgeTitle: asText(jsonData.knowledgeTitle, defaults.knowledgeTitle),
    knowledgeSubtitle: asText(jsonData.knowledgeSubtitle, defaults.knowledgeSubtitle),
    knowledgeItems: normalizeKnowledgeItems(jsonData.knowledgeItems, defaults.knowledgeItems),
  };
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "").trim();
    if (!cleaned) {
      return null;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: string[] = [];

  for (const item of value) {
    if (typeof item === "string") {
      const text = item.trim();
      if (text) {
        result.push(text);
      }
      continue;
    }

    if (item && typeof item === "object" && !Array.isArray(item)) {
      const data = item as Record<string, unknown>;
      const textRaw = data.text ?? data.value ?? data.label ?? data.name ?? data.title;
      const text = typeof textRaw === "string" ? textRaw.trim() : "";
      if (text) {
        result.push(text);
      }
    }
  }

  return result;
}

function extractOldPrice(details: unknown, priceNote: string | null, currentPrice: number): number | null {
  const candidates = normalizeTextArray(details);

  if (priceNote && /\d/.test(priceNote)) {
    candidates.unshift(priceNote);
  }

  for (const candidate of candidates) {
    const parsed = parseNumber(candidate);
    if (parsed && parsed > currentPrice) {
      return parsed;
    }
  }

  return null;
}

async function fetchSolarPlans(page: number, limit: number, q: string): Promise<{ data: SolarPlan[]; totalPages: number }> {
  const skip = (page - 1) * limit;

  try {
    const baseWhere = { type: "solar", status: true };
    const whereClause = {
      ...baseWhere,
      ...(q
        ? {
            name: { contains: q, mode: "insensitive" as const },
          }
        : {}),
    };

    const [promotions, total, totalByType] = await Promise.all([
      prisma.promotion.findMany({
        where: whereClause,
        orderBy: { displayOrder: "asc" },
        skip,
        take: limit,
      }),
      prisma.promotion.count({ where: whereClause }),
      q ? prisma.promotion.count({ where: baseWhere }) : Promise.resolve(0),
    ]);

    if (total > 0) {
      const mapped: SolarPlan[] = promotions.map((promotion) => {
        const featuresFromPerks = normalizeTextArray(promotion.perks);
        const fallbackFeatures = [promotion.validity, promotion.speed]
          .filter((item): item is string => Boolean(item && item.trim()))
          .map((item) => item.trim());

        return {
          id: promotion.id,
          name: promotion.name,
          subtitle: promotion.speed || "ระบบติดตั้งพร้อมอุปกรณ์ครบชุด",
          packageLabel: promotion.categoryName || "Solar Package",
          price: promotion.price,
          oldPrice: extractOldPrice(promotion.details, promotion.priceNote, promotion.price),
          features: featuresFromPerks.length > 0 ? featuresFromPerks : fallbackFeatures,
          note: promotion.priceNote,
          buyUrl: promotion.buyUrl,
        };
      });

      return {
        data: mapped,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }

    if (q && totalByType > 0) {
      return { data: [], totalPages: 1 };
    }
  } catch (error) {
    console.error("Failed to fetch solar plans from DB:", error);
  }

  const query = q.trim().toLowerCase();
  const filteredFallback = solarcellPackages.filter((item) => {
    if (!query) {
      return true;
    }

    return [item.title, item.pack, item.description]
      .filter((value) => typeof value === "string")
      .some((value) => value.toLowerCase().includes(query));
  });

  const mappedFallback: SolarPlan[] = filteredFallback.map((item) => ({
    id: item.id,
    name: item.title,
    subtitle: item.description,
    packageLabel: item.pack,
    price: parseNumber(item.price) || 0,
    oldPrice: parseNumber(item.discount_price),
    features: [item.solarcell, item.arae, item.scope, item.karantee].filter(Boolean),
    note: "ราคาโดยประมาณ (ขึ้นอยู่กับหน้างาน)",
    buyUrl: null,
  }));

  return {
    data: mappedFallback.slice((page - 1) * limit, page * limit),
    totalPages: Math.max(1, Math.ceil(mappedFallback.length / limit)),
  };
}

export default async function WEnergyPage(props: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const homeSectionDelegate = (prisma as any).homeSection;
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page || "1", 10);
  const q = searchParams?.q || "";
  const limit = 6;

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const [plansResponse, contentSection] = await Promise.all([
    fetchSolarPlans(safePage, limit, q),
    homeSectionDelegate ? homeSectionDelegate.findUnique({ where: { sectionKey: "wEnergyPageContent" } }) : null,
  ]);

  const { data: plans, totalPages } = plansResponse;
  const content = getWEnergyContent(contentSection ? JSON.parse(JSON.stringify(contentSection)) : null);

  return <WEnergyClient plans={plans} currentPage={safePage} totalPages={totalPages} content={content} />;
}
