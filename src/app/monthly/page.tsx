import type { Metadata } from "next";
import Box from "@mui/material/Box";
import BannerMonthy from "./components/Banner";
import BannerPromotionMonthy from "./components/BannerPromotion";
import PromotionMonthy from "./components/Promotions";
import StoreSearch from "@/src/components/ui/StoreSearch";
import StorePagination from "@/src/components/ui/StorePagination";
import { prisma } from "@/src/lib/prisma";
import { monthlyCategories, monthlyPackages } from "@/src/data/monthly";
import type { PackageCategory, PackageItem, PerkItem } from "@/src/types/package";

export const metadata: Metadata = {
  title: "แพ็กเกจซิมรายเดือน",
  description: "เปรียบเทียบแพ็กเกจรายเดือน ทั้งเน็ต โทร และบันเทิง พร้อมสมัครได้ทันทีจากเจ้าหน้าที่",
  alternates: { canonical: "/monthly" },
};

export const revalidate = 60;

function normalizePerks(value: unknown): PerkItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed: PerkItem[] = [];

  for (const item of value) {
    if (typeof item === "string") {
      const text = item.trim();
      if (text) parsed.push({ text });
      continue;
    }

    if (item && typeof item === "object" && !Array.isArray(item)) {
      const data = item as Record<string, unknown>;
      const textRaw = data.text ?? data.label ?? data.title ?? data.name;
      const imageRaw = data.imageUrl ?? data.icon ?? data.key;
      const text = typeof textRaw === "string" ? textRaw.trim() : "";
      const imageUrl = typeof imageRaw === "string" ? imageRaw.trim() : undefined;
      if (text) parsed.push({ text, imageUrl });
    }
  }

  return parsed;
}

function normalizeTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    if (typeof value === "string" && value.trim()) {
      return [value.trim()];
    }
    return [];
  }

  const parsed: string[] = [];

  for (const item of value) {
    if (typeof item === "string") {
      const text = item.trim();
      if (text) parsed.push(text);
      continue;
    }

    if (item && typeof item === "object" && !Array.isArray(item)) {
      const data = item as Record<string, unknown>;
      const textRaw = data.text ?? data.label ?? data.title ?? data.name;
      const text = typeof textRaw === "string" ? textRaw.trim() : "";
      if (text) parsed.push(text);
    }
  }

  return parsed;
}

function inferPerkIcon(text: string): string {
  const normalized = text.toLowerCase();

  if (/(วัน|เดือน|validity|ระยะเวลา|ชม\.|ชั่วโมง)/i.test(normalized)) {
    return "calendar";
  }

  if (/(โทร|call|นาที)/i.test(normalized)) {
    return "phone";
  }

  if (/(เกม|game|pubg|rov)/i.test(normalized)) {
    return "games";
  }

  if (/(ทีวี|tv|movie|series|ซีรีส์|หนัง|บันเทิง|บอล)/i.test(normalized)) {
    return "tv";
  }

  if (/(ประกัน|insurance|คุ้มครอง)/i.test(normalized)) {
    return "insurance";
  }

  return "speed";
}

function buildPromotionPerks(promotion: {
  perks: unknown;
  speed: string | null;
  validity: string | null;
  details: unknown;
  categoryName: string | null;
}): PerkItem[] {
  const fromPerks = normalizePerks(promotion.perks);
  if (fromPerks.length > 0) {
    return fromPerks;
  }

  const fallback: PerkItem[] = [];

  if (promotion.speed && promotion.speed.trim()) {
    fallback.push({ text: promotion.speed.trim(), imageUrl: "speed" });
  }

  if (promotion.validity && promotion.validity.trim()) {
    fallback.push({ text: promotion.validity.trim(), imageUrl: "calendar" });
  }

  for (const detail of normalizeTextList(promotion.details)) {
    if (fallback.length >= 3) {
      break;
    }

    if (fallback.some((item) => item.text === detail)) {
      continue;
    }

    fallback.push({
      text: detail,
      imageUrl: inferPerkIcon(detail),
    });
  }

  if (fallback.length === 0 && promotion.categoryName && promotion.categoryName.trim()) {
    fallback.push({ text: promotion.categoryName.trim(), imageUrl: "speed" });
  }

  return fallback;
}

function mapMonthlyCategoryId(categoryName: string | null): number {
  const normalized = (categoryName || "").trim().toLowerCase();

  const exact = monthlyCategories.find((category) => category.name.toLowerCase() === normalized);
  if (exact) return exact.id;

  if (normalized.includes("สปีด") || normalized.includes("speed")) return 1;
  if (normalized.includes("ไม่จำกัด") || normalized.includes("unlimit")) return 2;
  if (normalized.includes("โซเซียล") || normalized.includes("social")) return 3;
  if (normalized.includes("โทร") || normalized.includes("call")) return 4;
  if (normalized.includes("ซีรีส์") || normalized.includes("บันเทิง") || normalized.includes("entertain")) return 5;
  if (normalized.includes("คุ้มครอง") || normalized.includes("ประกัน") || normalized.includes("insurance")) return 6;
  if (normalized.includes("เกม") || normalized.includes("game") || normalized.includes("ไลฟ์สไตล์")) return 7;
  return 1;
}

async function fetchMonthlyPackages(page: number, limit: number, q: string): Promise<{ data: PackageItem[]; totalPages: number }> {
  const skip = (page - 1) * limit;

  try {
    const typeWhere: any = { type: "monthly", status: true };
    const whereClause: any = {
      ...typeWhere,
      ...(q
        ? {
            name: { contains: q, mode: "insensitive" },
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
      q ? prisma.promotion.count({ where: typeWhere }) : Promise.resolve(0),
    ]);

    if (total > 0) {
      const mapped = promotions.map((promo, index) => ({
        id: index + 1,
        category_id: mapMonthlyCategoryId(promo.categoryName),
        name: promo.name,
        price: promo.price,
        price_note: promo.priceNote,
        speed: promo.speed,
        perks: buildPromotionPerks({
          perks: promo.perks,
          speed: promo.speed,
          validity: promo.validity,
          details: promo.details,
          categoryName: promo.categoryName,
        }),
        description: null,
        promo_badge: promo.promoBadge || undefined,
        is_active: promo.status,
        buy_link: promo.buyUrl,
        display_order: promo.displayOrder,
      })) as PackageItem[];

      return {
        data: mapped,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }

    if (q && totalByType > 0) {
      return { data: [], totalPages: 1 };
    }
  } catch (error) {
    console.error("Failed to fetch monthly packages from DB:", error);
  }

  const filteredFallback = monthlyPackages.filter((pkg) =>
    q ? pkg.name.toLowerCase().includes(q.toLowerCase()) : true
  );

  return {
    data: filteredFallback.slice((page - 1) * limit, page * limit),
    totalPages: Math.max(1, Math.ceil(filteredFallback.length / limit)),
  };
}

export default async function MonthlyPage(props: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page || "1", 10);
  const q = searchParams?.q || "";
  const limit = 9;

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const { data: packages, totalPages } = await fetchMonthlyPackages(safePage, limit, q);

  return (
    <Box className="bg-white pb-20">
      <BannerMonthy />
      <BannerPromotionMonthy />

      <Box className="mt-7 max-w-6xl mx-auto px-4">
        <StoreSearch placeholder="ค้นหาแพ็กเกจรายเดือน..." />
      </Box>

      <PromotionMonthy categories={monthlyCategories as PackageCategory[]} packages={packages} />

      {totalPages > 1 && (
        <Box className="mt-8">
          <StorePagination currentPage={safePage} totalPages={totalPages} />
        </Box>
      )}
    </Box>
  );
}
