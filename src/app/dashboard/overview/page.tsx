import { prisma } from "@/src/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview | Dashboard",
  description: "ภาพรวมข้อมูลสำคัญของระบบหลังบ้าน",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 shadow-lg shadow-black/20">
      <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{formatNumber(value)}</p>
      <p className="mt-1 text-xs text-gray-400">{note}</p>
    </div>
  );
}

export default async function DashboardOverviewPage() {
  const [promotionCount, packageCount, bannerCount, contactCount, navCount] = await Promise.all([
    prisma.promotion.count({ where: { status: true } }),
    (prisma as any).package ? (prisma as any).package.count({ where: { status: true } }) : 0,
    prisma.banner.count({ where: { isActive: true } }),
    (prisma as any).contactMethod ? (prisma as any).contactMethod.count({ where: { isActive: true } }) : 0,
    prisma.navigationItem.count({ where: { isActive: true } }),
  ]);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-black text-white">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-400">สรุปภาพรวมข้อมูลสำคัญ และเตรียมพื้นที่สำหรับกราฟวิเคราะห์ในอนาคต</p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active Promotions" value={promotionCount} note="ข้อมูลโปรโมชันที่เปิดแสดงผล" />
        <StatCard label="Active Packages" value={packageCount} note="แพ็กเกจในส่วน Home Content" />
        <StatCard label="Active Banners" value={bannerCount} note="แบนเนอร์ที่กำลังใช้งาน" />
        <StatCard label="Contact Methods" value={contactCount} note="ช่องทางติดต่อที่เปิดใช้งาน" />
        <StatCard label="Nav Items" value={navCount} note="เมนูนำทางที่แสดงบนเว็บ" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-dashed border-blue-500/40 bg-blue-500/5 p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-blue-300">Chart Placeholder A</p>
          <h2 className="mt-2 text-xl font-bold text-white">Traffic & Conversion Trend</h2>
          <p className="mt-2 text-sm text-gray-300">
            พื้นที่สำหรับกราฟแนวโน้มผู้เข้าชม, Conversion, และประสิทธิภาพแคมเปญเมื่อเชื่อมข้อมูล analyze ในอนาคต
          </p>
          <div className="mt-5 h-56 rounded-xl border border-blue-500/30 bg-slate-950/40" />
        </div>

        <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">Chart Placeholder B</p>
          <h2 className="mt-2 text-xl font-bold text-white">Package Performance</h2>
          <p className="mt-2 text-sm text-gray-300">
            พื้นที่สำหรับกราฟเปรียบเทียบประสิทธิภาพแพ็กเกจรายหมวด เช่น Broadband, Topup, Monthly และ Solar
          </p>
          <div className="mt-5 h-56 rounded-xl border border-emerald-500/30 bg-slate-950/40" />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5">
        <h3 className="text-lg font-bold text-white">Next Step สำหรับระบบ Analyze</h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-300">
          <li>ผูกข้อมูลผู้เข้าชมจาก GA4 หรือแหล่งข้อมูลภายใน</li>
          <li>เพิ่ม endpoint สำหรับ aggregation รายวัน/รายสัปดาห์</li>
          <li>เชื่อม chart library เช่น Recharts/ECharts ในส่วน placeholder ข้างต้น</li>
        </ul>
      </section>
    </div>
  );
}
