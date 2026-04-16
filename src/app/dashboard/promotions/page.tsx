import { prisma } from "@/src/lib/prisma";
import PromotionManager from "./components/PromotionManager";

export default async function PromotionsPage(props: {
  searchParams: Promise<{ type?: string; page?: string; q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const type = searchParams.type || "broadband";
  const page = parseInt(searchParams.page || "1", 10);
  const q = searchParams.q || "";

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const limit = 10;
  const skip = (safePage - 1) * limit;

  const whereClause: any = { type };
  if (q) {
    whereClause.name = { contains: q, mode: "insensitive" };
  }

  const [promotions, total] = await Promise.all([
    prisma.promotion.findMany({
      where: whereClause,
      orderBy: { displayOrder: "asc" },
      skip,
      take: limit,
    }),
    prisma.promotion.count({ where: whereClause }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const s = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="space-y-12 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white">จัดการโปรโมชันทั้งหมด</h1>
        <p className="text-gray-400 mt-1">
          ระบบจัดการโปรโมชันสำหรับ เน็ตบ้าน, มือถือรายเดือน, มือถือเติมเงิน และ โซล่าเซลล์
        </p>
      </div>

      <section>
        <PromotionManager
          initialPromotions={s(promotions)}
          initialType={type}
          initialSearchQuery={q}
          currentPage={safePage}
          totalPages={totalPages}
        />
      </section>
    </div>
  );
}
