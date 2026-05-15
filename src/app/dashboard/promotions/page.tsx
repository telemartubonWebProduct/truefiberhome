import { prisma } from "@/src/lib/prisma";
import PromotionManager from "./components/PromotionManager";

export default async function PromotionsPage(props: {
  searchParams: Promise<{ page?: string; q?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const type = "broadband";
  const category = searchParams.category || "all";
  const page = parseInt(searchParams.page || "1", 10);
  const q = searchParams.q || "";

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const limit = 10;
  const skip = (safePage - 1) * limit;

  const whereClause: any = { type };
  if (q) {
    whereClause.name = { contains: q, mode: "insensitive" };
  }
  if (category !== "all") {
    whereClause.categoryName = { contains: category, mode: "insensitive" };
  }

  const [promotions, total, categoryNames] = await Promise.all([
    prisma.promotion.findMany({
      where: whereClause,
      orderBy: { displayOrder: "asc" },
      skip,
      take: limit,
    }),
    prisma.promotion.count({ where: whereClause }),
    prisma.promotion.findMany({
      where: { type: "broadband", status: true },
      select: { categoryName: true },
      distinct: ["categoryName"],
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  
  const allCategories = new Set<string>();
  categoryNames.forEach(c => {
    if (c.categoryName) {
      c.categoryName.split(',').forEach(cat => {
        const trimmed = cat.trim();
        if (trimmed) allCategories.add(trimmed);
      });
    }
  });
  const dynamicCategories = Array.from(allCategories);

  const s = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="space-y-12 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white">จัดการโปรโมชันเน็ตบ้าน</h1>
        <p className="text-gray-400 mt-1">
          ระบบจัดการแพ็กเกจอินเทอร์เน็ตบ้าน (Broadband)
        </p>
      </div>

      <section>
        <PromotionManager
          initialPromotions={s(promotions)}
          initialType={type}
          initialSearchQuery={q}
          initialCategory={category}
          currentPage={safePage}
          totalPages={totalPages}
          lockedType="broadband"
          dynamicCategories={dynamicCategories}
        />
      </section>
    </div>
  );
}
