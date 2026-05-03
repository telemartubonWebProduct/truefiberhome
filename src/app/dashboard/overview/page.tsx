import type { Metadata } from "next";
import AnalyticsSection from "./components/AnalyticsSection";
import Link from "next/link";
import {
  getCurrentMonthKey,
  getMonthDateRange,
  monthKeyToThaiLabel,
  normalizeMonthKey,
  summarizeDailyPerformance,
} from "@/src/lib/daily-performance";
import { prisma } from "@/src/lib/prisma";

export const metadata: Metadata = {
  title: "Overview | Dashboard",
  description: "ภาพรวมข้อมูลสำคัญของระบบหลังบ้าน",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}

function shiftMonthKey(monthKey: string, monthOffset: number) { 
  const [yearText, monthText] = monthKey.split("-");
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1 + monthOffset, 1));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${y}-${m}`;
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

export default async function DashboardOverviewPage(props: {
  searchParams: Promise<{ month?: string }>;
}) {
  const searchParams = await props.searchParams;
  const selectedMonth = normalizeMonthKey(searchParams.month);
  const currentMonth = getCurrentMonthKey();
  const previousMonth = shiftMonthKey(selectedMonth, -1);
  const nextMonth = shiftMonthKey(selectedMonth, 1);

  const { startDate, endDate } = getMonthDateRange(selectedMonth);

  const [promotionCount, packageCount, bannerCount, contactCount, navCount, monthRows, latestRows] =
    await Promise.all([
      prisma.promotion.count({ where: { status: true } }),
      (prisma as any).package ? (prisma as any).package.count({ where: { status: true } }) : 0,
      prisma.banner.count({ where: { isActive: true } }),
      (prisma as any).contactMethod
        ? (prisma as any).contactMethod.count({ where: { isActive: true } })
        : 0,
      prisma.navigationItem.count({ where: { isActive: true } }),
      (prisma as any).dailyPerformanceLog
        ? (prisma as any).dailyPerformanceLog.findMany({
            where: {
              recordDate: {
                gte: startDate,
                lt: endDate,
              },
            },
            orderBy: { recordDate: "asc" },
          })
        : [],
      (prisma as any).dailyPerformanceLog
        ? (prisma as any).dailyPerformanceLog.findMany({
            orderBy: { recordDate: "desc" },
            take: 7,
          })
        : [],
    ]);

  const monthSummary = summarizeDailyPerformance(monthRows);
  const onlineRegistrations =
    monthSummary.totalInstallSuccess +
    monthSummary.totalPendingInstall +
    monthSummary.totalInstallFailed;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-gray-400">
            สรุปภาพรวมข้อมูลสำคัญของระบบ และผลการขายออนไลน์รายเดือน
          </p>
        </div>


        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/overview?month=${previousMonth}`}
            className="rounded-full border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-gray-800"
          >
            เดือนก่อนหน้า
          </Link>
          <Link
            href={`/dashboard/overview?month=${currentMonth}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              selectedMonth === currentMonth
                ? "border-blue-500/40 bg-blue-500/20 text-blue-200"
                : "border-gray-700 text-gray-300 hover:bg-gray-800"
            }`}
          >
            เดือนปัจจุบัน
          </Link>
          <Link
            href={`/dashboard/overview?month=${nextMonth}`}
            className="rounded-full border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-gray-800"
          >
            เดือนถัดไป
          </Link>
          <Link
            href="/dashboard/daily-performance"
            className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20"
          >
            ไปหน้าบันทึกรายวัน
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active Promotions" value={promotionCount} note="ข้อมูลโปรโมชันที่เปิดแสดงผล" />
        <StatCard label="Active Packages" value={packageCount} note="แพ็กเกจในส่วน Home Content" />
        <StatCard label="Active Banners" value={bannerCount} note="แบนเนอร์ที่กำลังใช้งาน" />
        <StatCard label="Contact Methods" value={contactCount} note="ช่องทางติดต่อที่เปิดใช้งาน" />
        <StatCard label="Nav Items" value={navCount} note="เมนูนำทางที่แสดงบนเว็บ" />
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              รายงานยอดขายออนไลน์ ({monthKeyToThaiLabel(selectedMonth)})
            </h2>
            <p className="text-sm text-gray-400">ข้อมูลสรุปจากบันทึกรายวันของแอดมิน</p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-950/70 px-3 py-2 text-xs text-gray-300">
            บันทึกในเดือนนี้: {formatNumber(monthRows.length)} วัน
          </div>
        </div>

            <AnalyticsSection />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-800/60 text-xs uppercase tracking-[0.12em] text-gray-400">
                <th className="border border-gray-700 px-3 py-2 text-left">ช่องทาง</th>
                <th className="border border-gray-700 px-3 py-2 text-center">ลงทะเบียน</th>
                <th className="border border-gray-700 px-3 py-2 text-center">รอติดตั้ง</th>
                <th className="border border-gray-700 px-3 py-2 text-center">ติดตั้งสำเร็จ</th>
                <th className="border border-gray-700 px-3 py-2 text-center">ติดตั้งไม่ได้</th>
                <th className="border border-gray-700 px-3 py-2 text-center">รอส่งเอกสาร</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-950/40 text-gray-200">
                <td className="border border-gray-700 px-3 py-2 font-semibold">ขายออนไลน์</td>
                <td className="border border-gray-700 px-3 py-2 text-center font-semibold text-yellow-200">
                  {formatNumber(onlineRegistrations)}
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center">
                  {formatNumber(monthSummary.totalPendingInstall)}
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center font-semibold text-emerald-300">
                  {formatNumber(monthSummary.totalInstallSuccess)}
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center font-semibold text-rose-300">
                  {formatNumber(monthSummary.totalInstallFailed)}
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center">
                  {formatNumber(monthSummary.totalWaitingDocuments)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
            <p className="text-xs text-gray-500">ลีดจาก Line</p>
            <p className="mt-1 text-2xl font-black text-white">{formatNumber(monthSummary.totalLineLeads)}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
            <p className="text-xs text-gray-500">ลีดจากเบอร์โทร</p>
            <p className="mt-1 text-2xl font-black text-white">{formatNumber(monthSummary.totalPhoneLeads)}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
            <p className="text-xs text-gray-500">ลีดจาก Facebook</p>
            <p className="mt-1 text-2xl font-black text-white">{formatNumber(monthSummary.totalFacebookLeads)}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
            <p className="text-xs text-gray-500">ยอดขายสำเร็จ</p>
            <p className="mt-1 text-2xl font-black text-cyan-300">{formatNumber(monthSummary.totalSalesSuccess)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold text-white">7 รายการล่าสุดจากบันทึกรายวัน</h3>
          <Link
            href="/dashboard/daily-performance"
            className="text-sm font-medium text-blue-300 hover:text-blue-200"
          >
            จัดการข้อมูลทั้งหมด
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-800/60 text-xs uppercase tracking-[0.1em] text-gray-400">
                <th className="border border-gray-700 px-2 py-2 text-left">วันที่</th>
                <th className="border border-gray-700 px-2 py-2 text-center">Line</th>
                <th className="border border-gray-700 px-2 py-2 text-center">เบอร์โทร</th>
                <th className="border border-gray-700 px-2 py-2 text-center">Facebook</th>
                <th className="border border-gray-700 px-2 py-2 text-center">ติดตั้งสำเร็จ</th>
                <th className="border border-gray-700 px-2 py-2 text-center">ติดตั้งไม่ได้</th>
                <th className="border border-gray-700 px-2 py-2 text-center">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {latestRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-gray-700 px-3 py-8 text-center text-gray-500">
                    ยังไม่มีข้อมูลบันทึกรายวัน
                  </td>
                </tr>
              ) : (
                latestRows.map((row: any) => (
                  <tr key={row.id} className="text-gray-200 hover:bg-gray-800/20">
                    <td className="border border-gray-700 px-2 py-2">
                      {new Intl.DateTimeFormat("th-TH", {
                        timeZone: "Asia/Bangkok",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }).format(new Date(row.recordDate))}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center">
                      {formatNumber(row.lineLeads)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center">
                      {formatNumber(row.phoneLeads)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center">
                      {formatNumber(row.facebookLeads)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center text-emerald-300">
                      {formatNumber(row.installSuccess)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center text-rose-300">
                      {formatNumber(row.installFailed)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 max-w-[260px] truncate">
                      {row.notes || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Google Analytics Section */}
  

    </div>
  );
}
