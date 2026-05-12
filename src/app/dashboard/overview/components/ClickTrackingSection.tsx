"use client";

import { useEffect, useState, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EventTotal {
  eventName: string;
  count: number;
}

interface DailyRow {
  date: string;
  line_click: number;
  phone_click: number;
  facebook_click: number;
  signup_interest: number;
}

interface ClickStatsData {
  totals: EventTotal[];
  todayTotals: EventTotal[];
  daily: DailyRow[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

function fmt(v: number) {
  return new Intl.NumberFormat("th-TH").format(v);
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
  }).format(d);
}

const PERIODS = [
  { value: "today", label: "วันนี้" },
  { value: "7days", label: "7 วัน" },
  { value: "30days", label: "30 วัน" },
  { value: "all", label: "ทั้งหมด" },
];

interface CardConfig {
  eventName: string;
  label: string;
  emoji: string;
  gradient: string;
  border: string;
}

const CARDS: CardConfig[] = [
  {
    eventName: "line_click",
    label: "กดแอดไลน์",
    emoji: "📱",
    gradient: "linear-gradient(135deg, #00B900, #00d900)",
    border: "border-emerald-500/30",
  },
  {
    eventName: "phone_click",
    label: "กดโทรสมัคร",
    emoji: "📞",
    gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    border: "border-blue-500/30",
  },
  {
    eventName: "facebook_click",
    label: "กดไป Facebook",
    emoji: "📘",
    gradient: "linear-gradient(135deg, #1877F2, #42a5f5)",
    border: "border-sky-500/30",
  },
  {
    eventName: "signup_interest",
    label: "สนใจสมัคร",
    emoji: "✅",
    gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
    border: "border-violet-500/30",
  },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ClickCard({
  config,
  total,
  today,
}: {
  config: CardConfig;
  total: number;
  today: number;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${config.border} bg-gray-900/60 p-5 shadow-lg shadow-black/20 transition-all duration-300 hover:shadow-xl`}
    >
      {/* glow */}
      <div
        className="absolute top-0 right-0 h-24 w-24 -translate-y-6 translate-x-6 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30"
        style={{ background: config.gradient }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
            {config.label}
          </p>
          <p className="mt-2 text-3xl font-black text-white">{fmt(total)}</p>
          <p className="mt-1 text-xs text-gray-400">
            วันนี้{" "}
            <span className="font-bold text-emerald-300">+{fmt(today)}</span>
          </p>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-xl opacity-90"
          style={{ background: config.gradient }}
        >
          {config.emoji}
        </div>
      </div>
    </div>
  );
}

function DailyTable({ rows }: { rows: DailyRow[] }) {
  // Show most recent on top
  const sorted = [...rows].reverse();

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        ยังไม่มีข้อมูลการคลิก
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead>
          <tr className="bg-gray-800/60 text-xs uppercase tracking-[0.1em] text-gray-400">
            <th className="border border-gray-700 px-3 py-2 text-left">
              วันที่
            </th>
            <th className="border border-gray-700 px-3 py-2 text-center">
              <span className="inline-flex items-center gap-1">
                📱 LINE
              </span>
            </th>
            <th className="border border-gray-700 px-3 py-2 text-center">
              <span className="inline-flex items-center gap-1">
                📞 โทร
              </span>
            </th>
            <th className="border border-gray-700 px-3 py-2 text-center">
              <span className="inline-flex items-center gap-1">
                📘 Facebook
              </span>
            </th>
            <th className="border border-gray-700 px-3 py-2 text-center">
              <span className="inline-flex items-center gap-1">
                ✅ สนใจสมัคร
              </span>
            </th>
            <th className="border border-gray-700 px-3 py-2 text-center">
              รวม
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const rowTotal =
              row.line_click +
              row.phone_click +
              row.facebook_click +
              row.signup_interest;
            const isToday =
              row.date ===
              new Date().toLocaleDateString("en-CA", {
                timeZone: "Asia/Bangkok",
              });

            return (
              <tr
                key={row.date}
                className={`text-gray-200 transition ${
                  isToday
                    ? "bg-emerald-500/5 border-l-2 border-l-emerald-400"
                    : "hover:bg-gray-800/20"
                }`}
              >
                <td className="border border-gray-700 px-3 py-2 font-medium">
                  {formatDateLabel(row.date)}
                  {isToday && (
                    <span className="ml-2 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      วันนี้
                    </span>
                  )}
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center font-semibold">
                  {row.line_click > 0 ? (
                    <span className="text-emerald-300">
                      {fmt(row.line_click)}
                    </span>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center font-semibold">
                  {row.phone_click > 0 ? (
                    <span className="text-blue-300">
                      {fmt(row.phone_click)}
                    </span>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center font-semibold">
                  {row.facebook_click > 0 ? (
                    <span className="text-sky-300">
                      {fmt(row.facebook_click)}
                    </span>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center font-semibold">
                  {row.signup_interest > 0 ? (
                    <span className="text-violet-300">
                      {fmt(row.signup_interest)}
                    </span>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center font-black text-white">
                  {rowTotal > 0 ? fmt(rowTotal) : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-800/50 text-gray-100 font-semibold">
            <td className="border border-gray-700 px-3 py-2">รวมทั้งหมด</td>
            <td className="border border-gray-700 px-3 py-2 text-center text-emerald-300">
              {fmt(sorted.reduce((s, r) => s + r.line_click, 0))}
            </td>
            <td className="border border-gray-700 px-3 py-2 text-center text-blue-300">
              {fmt(sorted.reduce((s, r) => s + r.phone_click, 0))}
            </td>
            <td className="border border-gray-700 px-3 py-2 text-center text-sky-300">
              {fmt(sorted.reduce((s, r) => s + r.facebook_click, 0))}
            </td>
            <td className="border border-gray-700 px-3 py-2 text-center text-violet-300">
              {fmt(sorted.reduce((s, r) => s + r.signup_interest, 0))}
            </td>
            <td className="border border-gray-700 px-3 py-2 text-center font-black text-white">
              {fmt(
                sorted.reduce(
                  (s, r) =>
                    s +
                    r.line_click +
                    r.phone_click +
                    r.facebook_click +
                    r.signup_interest,
                  0,
                ),
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini bar chart (visual breakdown)                                   */
/* ------------------------------------------------------------------ */

function MiniBarChart({ rows }: { rows: DailyRow[] }) {
  if (rows.length === 0) return null;

  // Show last 14 days max
  const slice = rows.slice(-14);
  const maxVal = Math.max(
    1,
    ...slice.map(
      (r) =>
        r.line_click + r.phone_click + r.facebook_click + r.signup_interest,
    ),
  );

  return (
    <div className="flex items-end gap-1 h-28">
      {slice.map((row) => {
        const total =
          row.line_click +
          row.phone_click +
          row.facebook_click +
          row.signup_interest;
        const pct = Math.max(4, (total / maxVal) * 100);
        const isToday =
          row.date ===
          new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Bangkok",
          });

        return (
          <div
            key={row.date}
            className="group relative flex-1 min-w-[8px]"
            title={`${formatDateLabel(row.date)}: ${total} คลิก`}
          >
            <div
              className={`rounded-t transition-all duration-300 ${
                isToday
                  ? "bg-gradient-to-t from-emerald-500 to-emerald-300"
                  : "bg-gradient-to-t from-indigo-600 to-indigo-400 opacity-70 group-hover:opacity-100"
              }`}
              style={{ height: `${pct}%` }}
            />
            {isToday && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-emerald-300">
                {total}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ClickTrackingSection() {
  const [period, setPeriod] = useState("30days");
  const [data, setData] = useState<ClickStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/click-stats?period=${period}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = window.setInterval(fetchData, 30_000);
    return () => window.clearInterval(id);
  }, [fetchData]);

  const getTotal = (eventName: string) =>
    data?.totals.find((t) => t.eventName === eventName)?.count ?? 0;
  const getToday = (eventName: string) =>
    data?.todayTotals.find((t) => t.eventName === eventName)?.count ?? 0;

  return (
    <section className="space-y-5">
      {/* Header + Period selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h2 className="text-xl font-bold text-white">
              ติดตามการคลิกปุ่ม
            </h2>
            {!loading && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-400">
            ข้อมูลจากเว็บไซต์โดยตรง อัปเดตทุก 30 วินาที
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                period === p.value
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 shadow-sm"
                  : "border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && !data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 animate-pulse"
            >
              <div className="h-3 w-20 rounded bg-gray-700 mb-3" />
              <div className="h-8 w-24 rounded bg-gray-700 mb-2" />
              <div className="h-3 w-16 rounded bg-gray-700" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <p className="text-sm font-semibold text-red-300">
            ไม่สามารถโหลดข้อมูลการคลิกได้
          </p>
          <p className="mt-1 text-xs text-red-400/80">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/30"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      )}

      {/* Data display */}
      {data && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CARDS.map((card) => (
              <ClickCard
                key={card.eventName}
                config={card}
                total={getTotal(card.eventName)}
                today={getToday(card.eventName)}
              />
            ))}
          </div>

          {/* Bar chart + Daily table */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-[0.12em]">
                📊 สถิติรายวัน
              </h3>
              <span className="text-xs text-gray-500">
                {data.daily.length} วัน
              </span>
            </div>

            {/* Mini bar chart */}
            <div className="mb-5 rounded-xl border border-gray-800 bg-gray-950/40 p-4">
              <MiniBarChart rows={data.daily} />
              <div className="mt-2 flex justify-between text-[10px] text-gray-600">
                <span>
                  {data.daily.length > 0
                    ? formatDateLabel(data.daily[0].date)
                    : ""}
                </span>
                <span>
                  {data.daily.length > 0
                    ? formatDateLabel(data.daily[data.daily.length - 1].date)
                    : ""}
                </span>
              </div>
            </div>

            {/* Data table */}
            <DailyTable rows={data.daily} />
          </div>
        </>
      )}
    </section>
  );
}
