import type { Metadata } from "next";
import DailyPerformanceManager from "./components/DailyPerformanceManager";
import {
  getMonthDateRange,
  getTodayInputValue,
  normalizeMonthKey,
  summarizeDailyPerformance,
} from "@/src/lib/daily-performance";
import { prisma } from "@/src/lib/prisma";

export const metadata: Metadata = {
  title: "Daily Performance | Dashboard",
  description: "บันทึกยอดลูกค้าและผลการติดตั้งรายวันสำหรับแอดมิน",
};

export default async function DashboardDailyPerformancePage(props: {
  searchParams: Promise<{ month?: string }>;
}) {
  const searchParams = await props.searchParams;
  const month = normalizeMonthKey(searchParams.month);
  const { startDate, endDate } = getMonthDateRange(month);

  const dailyPerformanceLog = (prisma as any).dailyPerformanceLog;
  const isDelegateReady = typeof dailyPerformanceLog?.findMany === "function";

  const rows = isDelegateReady
    ? await dailyPerformanceLog.findMany({
        where: {
          recordDate: {
            gte: startDate,
            lt: endDate,
          },
        },
        orderBy: {
          recordDate: "asc",
        },
      })
    : [];

  const summary = summarizeDailyPerformance(rows);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white">บันทึกผลงานรายวัน</h1>
        <p className="mt-1 text-sm text-gray-400">
          กรอกยอดลูกค้าและสถานะงานติดตั้งทุกวัน จากนั้นระบบจะสรุปผลรายเดือนให้ที่หน้า Overview อัตโนมัติ
        </p>
      </div>

      {!isDelegateReady ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          ระบบยังไม่พร้อมใช้งานตารางบันทึกรายวันชั่วคราว กรุณารัน migration/db push และรีสตาร์ต dev server
          เพื่อโหลด Prisma client เวอร์ชันล่าสุด
        </div>
      ) : null}

      <DailyPerformanceManager
        initialMonth={month}
        initialRows={JSON.parse(JSON.stringify(rows))}
        initialSummary={summary}
        todayDate={getTodayInputValue()}
      />
    </div>
  );
}
