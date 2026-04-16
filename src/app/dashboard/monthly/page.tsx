import { prisma } from "@/src/lib/prisma";
import PromotionManager from "../promotions/components/PromotionManager";

export default async function DashboardMonthlyPage(props: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const type = "monthly";
  const q = searchParams.q || "";
  const page = parseInt(searchParams.page || "1", 10);

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const limit = 10;
  const skip = (safePage - 1) * limit;

  const whereClause: any = {
    type,
    ...(q
      ? {
          name: { contains: q, mode: "insensitive" },
        }
      : {}),
  };

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
        <h1 className="text-3xl font-bold text-white">จัดการโปรโมชันรายเดือน</h1>
        <p className="text-gray-400 mt-1">เพิ่ม แก้ไข ลบ และสลับสถานะโปรโมชันที่จะแสดงในหน้า /monthly</p>
      </div>

      <section>
        <PromotionManager
          initialPromotions={s(promotions)}
          initialType={type}
          initialSearchQuery={q}
          currentPage={safePage}
          totalPages={totalPages}
          lockedType={type}
        />
      </section>
    </div>
  );
}
