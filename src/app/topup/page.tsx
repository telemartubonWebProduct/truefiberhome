import type { Metadata } from "next";
import Box from "@mui/material/Box";
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

async function fetchTopupPackages(page: number, limit: number, q: string, categoryId: number | null): Promise<{ data: PackageItem[]; totalPages: number }> {
  const skip = (page - 1) * limit;

  try {
    const typeWhere: any = { type: "topup", status: true };
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
      perks: normalizePerks(promo.perks),
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

async function fetchTopupRecommendedPromotions(): Promise<RecommendedTopupPromotion[]> {
  const whereBase: any = { type: "topup", status: true };

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

export default async function TopupPage(props: { searchParams: Promise<{ page?: string; q?: string; category?: string }> }) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page || "1", 10);
  const q = searchParams?.q || "";
  const categoryStr = searchParams?.category || "all";
  const categoryId = categoryStr === "all" ? null : parseInt(categoryStr, 10);
  const limit = 8;

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const [{ data: packages, totalPages }, recommendedPromotions] = await Promise.all([
    fetchTopupPackages(safePage, limit, q, categoryId),
    fetchTopupRecommendedPromotions(),
  ]);

  return (
    <Box className="bg-white pb-20">
      <BannerTop />
      <PromotionBanner promotions={recommendedPromotions} />

      <Box className="mt-7 max-w-6xl mx-auto px-4">
        <StoreSearch placeholder="ค้นหาแพ็กเกจเติมเงิน..." />
      </Box>

      <PackageList packages={packages} />

      {totalPages > 1 && (
        <Box className="mt-8">
          <StorePagination currentPage={safePage} totalPages={totalPages} />
        </Box>
      )}
    </Box>
  );
}
