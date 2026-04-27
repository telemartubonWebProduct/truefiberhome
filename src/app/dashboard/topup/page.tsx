import { prisma } from "@/src/lib/prisma";
import PromotionManager from "../promotions/components/PromotionManager";

import Link from "next/link";

export default async function DashboardTopupPage(props: {
  searchParams: Promise<{ page?: string; q?: string; network?: string }>;
}) {
  const searchParams = await props.searchParams;
  const network = searchParams.network === "dtac" ? "dtac" : "true";
  const type = network === "dtac" ? "topup_dtac" : "topup";
  const q = searchParams.q || "";
  const page = parseInt(searchParams.page || "1", 10);

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const limit = 10;
  const skip = (safePage - 1) * limit;
  const activeTopupWhere: any = { type, status: true };
  const recommendedTopupWhere: any = {
    ...activeTopupWhere,
    promoBadge: { contains: "แนะนำ", mode: "insensitive" },
  };

  const whereClause: any = {
    type,
    ...(q
      ? {
          name: { contains: q, mode: "insensitive" },
        }
      : {}),
  };

  const [promotions, total, activeTopupTotal, recommendedTopupTotal] = await Promise.all([
    prisma.promotion.findMany({
      where: whereClause,
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.promotion.count({ where: whereClause }),
    prisma.promotion.count({ where: activeTopupWhere }),
    prisma.promotion.count({ where: recommendedTopupWhere }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const s = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="space-y-12 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white">จัดการโปรโมชันเติมเงิน</h1>
        <p className="text-gray-400 mt-1">หน้าเดียวสำหรับแก้ข้อมูลหลักและแพ็กแนะนำของหน้า /topup</p>

        <div className="mt-6 flex items-center gap-3">
          <Link
            href="?network=true"
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              network === "true"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            ซิมทรู (True)
          </Link>
          <Link
            href="?network=dtac"
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              network === "dtac"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            ซิมดีแทค (Dtac)
          </Link>
        </div>

        <div className="mt-6 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3">
            <p className="text-xs text-gray-400">ข้อมูลหลัก (รายการแพ็กหน้า /topup)</p>
            <p className="mt-1 text-lg font-semibold text-white">{activeTopupTotal.toLocaleString()} รายการเปิดใช้งาน</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3">
            <p className="text-xs text-gray-400">แพ็กแนะนำ (แบนเนอร์บนหน้า /topup)</p>
            <p className="mt-1 text-lg font-semibold text-white">{recommendedTopupTotal.toLocaleString()} รายการ</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500">หน้า /topup แสดงเฉพาะรายการที่สถานะเป็น "แสดงผล" และเรียงตาม Display Order จากน้อยไปมาก</p>
        <p className="mt-1 text-xs text-gray-500">กล่องโปรเติมเงินแนะนำจะแสดงสูงสุด 4 รายการ โดยเลือกเปิด/ปิดได้จากคอลัมน์ "โปรเติมเงินแนะนำ" ในตารางด้านล่าง</p>
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
