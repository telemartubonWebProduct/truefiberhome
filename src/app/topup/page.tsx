import type { Metadata } from "next";
import Box from "@mui/material/Box";
import BannerTop from "./components/BannerTop";
import PromotionBanner from "./components/PromotionBanner";
import PackageList from "./components/PackageList";
import StoreSearch from "@/src/components/ui/StoreSearch";
import StorePagination from "@/src/components/ui/StorePagination";
import { prisma } from "@/src/lib/prisma";
import { topupCategories, topupPackages } from "@/src/data/topup";
import type { PackageItem, PerkItem } from "@/src/types/package";

export const metadata: Metadata = {
  title: "แพ็กเกจซิมเติมเงิน",
  description: "แพ็กเกจซิมเติมเงิน เน็ต โทร โซเชียล และบันเทิง คัดมาให้เลือกง่าย พร้อมสมัครได้ทันที",
  alternates: { canonical: "/topup" },
};

export const revalidate = 0;

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

  if (normalized.includes("เน็ต") && normalized.includes("โทร")) return 2;
  if (normalized.includes("โทร") && !normalized.includes("เน็ต")) return 3;
  if (normalized.includes("บันเทิง") || normalized.includes("entertain") || normalized.includes("series")) return 4;
  if (normalized.includes("เกม") || normalized.includes("game")) return 5;
  if (normalized.includes("ประกัน") || normalized.includes("insurance")) return 6;
  return 1;
}

async function fetchTopupPackages(page: number, limit: number, q: string): Promise<{ data: PackageItem[]; totalPages: number }> {
  const skip = (page - 1) * limit;

  try {
    const typeWhere: any = { type: "topup", status: true };
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
    }

    if (q && totalByType > 0) {
      return { data: [], totalPages: 1 };
    }
  } catch (error) {
    console.error("Failed to fetch topup packages from DB:", error);
  }

  const filteredFallback = topupPackages.filter((pkg) =>
    q ? pkg.name.toLowerCase().includes(q.toLowerCase()) : true
  );

  return {
    data: filteredFallback.slice((page - 1) * limit, page * limit),
    totalPages: Math.max(1, Math.ceil(filteredFallback.length / limit)),
  };
}

export default async function TopupPage(props: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page || "1", 10);
  const q = searchParams?.q || "";
  const limit = 8;

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const { data: packages, totalPages } = await fetchTopupPackages(safePage, limit, q);

  return (
    <Box className="bg-white pb-20">
      <BannerTop />
      <PromotionBanner />

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
