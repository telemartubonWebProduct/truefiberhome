import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Link from "next/link";
import BannerTop from "./components/BannerTop";
import PromotionBanner from "./components/PromotionBanner";
import PackageList from "./components/PackageList";
import StoreSearch from "@/src/components/ui/StoreSearch";
import StorePagination from "@/src/components/ui/StorePagination";
import { prisma } from "@/src/lib/prisma";
import { topupCategories } from "@/src/data/topup";
import type { PackageItem, PerkItem } from "@/src/types/package";

type RecommendedTopupPromotion = {
  id: string;
  title: string;
  validity: string | null;
  speed: string | null;
  price: number;
};

export const metadata: Metadata = {
  title: "แพ็กเกจซิมเติมเงิน",
  description: "แพ็กเกจซิมเติมเงิน เน็ต โทร โซเชียล และบันเทิง คัดมาให้เลือกง่าย พร้อมสมัครได้ทันที",
  alternates: { canonical: "/topup" },
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

  return "wifi";
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
    fallback.push({ text: promotion.speed.trim(), imageUrl: "wifi" });
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
    fallback.push({ text: promotion.categoryName.trim(), imageUrl: "wifi" });
  }

  return fallback;
}

function mapTopupCategoryId(categoryName: string | null): number {
  const normalized = (categoryName || "").trim().toLowerCase();

  const exact = topupCategories.find((category) => category.name.toLowerCase() === normalized);
  if (exact) return exact.id;

  if (normalized.includes("รายวัน")) return 1;
  if (normalized.includes("สัปดาห์")) return 2;
  if (normalized.includes("30") || normalized.includes("เดือน")) return 3;
  if (normalized.includes("มาราธอน")) return 4;
  return 1;
}

async function fetchTopupPackages(page: number, limit: number, q: string, categoryId: number | null, networkType: string): Promise<{ data: PackageItem[]; totalPages: number }> {
  const skip = (page - 1) * limit;

  try {
    const typeWhere: any = { type: networkType, status: true };
    const selectedCategory = categoryId ? topupCategories.find(c => c.id === categoryId) : null;
    
    const whereClause: any = {
      ...typeWhere,
      ...(q
        ? {
            name: { contains: q, mode: "insensitive" },
          }
        : {}),
      ...(selectedCategory 
        ? { 
            categoryName: { contains: selectedCategory.name, mode: "insensitive" } 
          } 
        : {}),
    };

    const [promotions, total] = await Promise.all([
      prisma.promotion.findMany({
        where: whereClause,
        orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.promotion.count({ where: whereClause }),
    ]);

    const mapped = promotions.map((promo, index) => ({
      id: skip + index + 1,
      category_id: mapTopupCategoryId(promo.categoryName),
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
      is_active: promo.status,
      buy_link: promo.buyUrl,
      display_order: promo.displayOrder,
    })) as PackageItem[];

    return {
      data: mapped,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  } catch (error) {
    console.error("Failed to fetch topup packages from DB:", error);
    return {
      data: [],
      totalPages: 1,
    };
  }
}

function toRecommendedPromotion(promo: {
  id: string;
  name: string;
  validity: string | null;
  speed: string | null;
  price: number;
}): RecommendedTopupPromotion {
  return {
    id: promo.id,
    title: promo.name,
    validity: promo.validity,
    speed: promo.speed,
    price: promo.price,
  };
}

async function fetchTopupRecommendedPromotions(networkType: string): Promise<RecommendedTopupPromotion[]> {
  const whereBase: any = { type: networkType, status: true };

  try {
    const recommended = await prisma.promotion.findMany({
      where: {
        ...whereBase,
        promoBadge: {
          contains: "แนะนำ",
          mode: "insensitive",
        },
      },
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
      take: 4,
    });

    return recommended.map(toRecommendedPromotion);
  } catch (error) {
    console.error("Failed to fetch topup recommended promotions from DB:", error);
    return [];
  }
}

export default async function TopupPage(props: { searchParams: Promise<{ page?: string; q?: string; category?: string; network?: string }> }) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page || "1", 10);
  const q = searchParams?.q || "";
  const network = searchParams?.network === "dtac" ? "dtac" : "true";
  const networkType = network === "dtac" ? "topup_dtac" : "topup";
  const categoryStr = searchParams?.category || "all";
  const categoryId = categoryStr === "all" ? null : parseInt(categoryStr, 10);
  const limit = 8;

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const [{ data: packages, totalPages }, recommendedPromotions] = await Promise.all([
    fetchTopupPackages(safePage, limit, q, categoryId, networkType),
    fetchTopupRecommendedPromotions(networkType),
  ]);

  return (
    <Box className="bg-white pb-20">
      <BannerTop />
      
      {/* Network Switcher */}
      <Box className="flex justify-center -mt-6 relative z-10">
        <div className="bg-white p-1.5 rounded-full shadow-lg border border-gray-100 flex items-center gap-1">
          <Link
            href="?network=true"
            className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
              network === "true" 
                ? "bg-red-600 text-white shadow-md shadow-red-600/20" 
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            ซิมทรู (True)
          </Link>
          <Link
            href="?network=dtac"
            className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
              network === "dtac" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            ซิมดีแทค (Dtac)
          </Link>
        </div>
      </Box>

      <div className="mt-8">
        <PromotionBanner promotions={recommendedPromotions} />
      </div>

      <Box className="mt-7 max-w-6xl mx-auto px-4">
        <StoreSearch placeholder="ค้นหาแพ็กเกจเติมเงิน..." />
      </Box>

      <PackageList packages={packages} themeColor={network === "dtac" ? "blue" : "red"} />

      {totalPages > 1 && (
        <Box className="mt-8">
          <StorePagination currentPage={safePage} totalPages={totalPages} />
        </Box>
      )}
    </Box>
  );
}
