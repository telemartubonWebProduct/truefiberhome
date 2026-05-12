"use client";

import { useEffect, useState, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AnalyticsOverview {
  sessions: number;
  pageViews: number;
  totalUsers: number;
  newUsers: number;
  bounceRate: number;
  avgSessionDurationSec: number;
}
interface PageMetric { path: string; views: number; }
interface ChannelMetric { channel: string; sessions: number; }
interface DeviceMetric { device: string; sessions: number; }
interface AnalyticsSummary {
  overview: AnalyticsOverview;
  topPages: PageMetric[];
  trafficSources: ChannelMetric[];
  devices: DeviceMetric[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(v: number) { return new Intl.NumberFormat("th-TH").format(v); }
function fmtDur(s: number) { return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`; }

const DEVICE_COLORS: Record<string, string> = { desktop: "#6366f1", mobile: "#f59e0b", tablet: "#10b981" };
const DEVICE_LABELS: Record<string, string> = { desktop: "Desktop", mobile: "Mobile", tablet: "Tablet" };
const CHANNEL_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const TIME_RANGES = [
  { label: "วันนี้", startDate: "today", endDate: "today" },
  { label: "สัปดาห์", startDate: "7daysAgo", endDate: "today" },
  { label: "เดือน", startDate: "30daysAgo", endDate: "today" },
  { label: "ปี", startDate: "365daysAgo", endDate: "today" },
  { label: "All Time", startDate: "2020-01-01", endDate: "today" },
];



/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 animate-pulse">
      <div className="h-3 w-20 rounded bg-gray-700 mb-3" />
      <div className="h-8 w-24 rounded bg-gray-700 mb-2" />
      <div className="h-3 w-16 rounded bg-gray-700" />
    </div>
  );
}

function MetricCard({ label, value, subtext, icon, gradient }: {
  label: string; value: string; subtext: string; icon: React.ReactNode; gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 p-5 shadow-lg shadow-black/20 transition-all duration-300 hover:border-gray-700 hover:shadow-xl">
      <div className="absolute top-0 right-0 h-24 w-24 -translate-y-6 translate-x-6 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30" style={{ background: gradient }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs text-gray-400">{subtext}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl opacity-80" style={{ background: gradient }}>{icon}</div>
      </div>
    </div>
  );
}



function TrafficBar({ channel, sessions, maxSessions, color }: {
  channel: string; sessions: number; maxSessions: number; color: string;
}) {
  const pct = maxSessions > 0 ? (sessions / maxSessions) * 100 : 0;
  return (
    <div className="group flex items-center gap-3">
      <div className="w-28 shrink-0 text-right text-xs text-gray-400 truncate">{channel}</div>
      <div className="flex-1 h-6 rounded-full bg-gray-800/60 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: color, minWidth: "2px" }} />
      </div>
      <div className="w-14 text-right text-xs font-semibold text-gray-300">{fmt(sessions)}</div>
    </div>
  );
}

function DeviceDonut({ devices }: { devices: DeviceMetric[] }) {
  const total = devices.reduce((s, d) => s + d.sessions, 0);
  if (total === 0) return <p className="text-sm text-gray-500 text-center py-8">ไม่มีข้อมูล</p>;
  let cum = 0;
  const segs = devices.map((d) => {
    const start = cum; const pct = (d.sessions / total) * 100; cum += pct;
    return `${DEVICE_COLORS[d.device.toLowerCase()] || "#6b7280"} ${start}% ${cum}%`;
  });
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8">
      <div className="relative h-36 w-36 shrink-0">
        <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${segs.join(", ")})` }} />
        <div className="absolute inset-[25%] rounded-full bg-gray-900" />
        <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-black text-white">{fmt(total)}</span></div>
      </div>
      <div className="flex flex-col gap-2">
        {devices.map((d) => {
          const color = DEVICE_COLORS[d.device.toLowerCase()] || "#6b7280";
          return (
            <div key={d.device} className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
              <span className="text-sm text-gray-300">{DEVICE_LABELS[d.device.toLowerCase()] || d.device}</span>
              <span className="text-xs text-gray-500">{fmt(d.sessions)} ({((d.sessions / total) * 100).toFixed(1)}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icons (inline SVGs for metric cards)                               */
/* ------------------------------------------------------------------ */
const SvgIcon = ({ d }: { d: string }) => (
  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const METRIC_ICONS = {
  sessions: <SvgIcon d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
  pageViews: <><SvgIcon d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /></>,
  totalUsers: <SvgIcon d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />,
  newUsers: <SvgIcon d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />,
  bounceRate: <SvgIcon d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />,
  avgDuration: <SvgIcon d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function AnalyticsSection() {
  const [rangeIdx, setRangeIdx] = useState(2); // default "เดือน"
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = TIME_RANGES[rangeIdx];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?startDate=${range.startDate}&endDate=${range.endDate}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData({
        overview: json.overview,
        topPages: json.topPages ?? [],
        trafficSources: json.trafficSources ?? [],
        devices: json.devices ?? [],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [range.startDate, range.endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ----- Loading ----- */
  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-400" />
          <span className="text-sm text-gray-400">กำลังโหลดข้อมูล Google Analytics …</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </section>
    );
  }

  /* ----- Error ----- */
  if (error) {
    return (
      <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-300">ไม่สามารถโหลดข้อมูล Google Analytics ได้</p>
            <p className="mt-1 text-xs text-red-400/80">{error}</p>
            <button onClick={fetchData} className="mt-3 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/30">ลองใหม่อีกครั้ง</button>
          </div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  const { overview, topPages, trafficSources, devices } = data;
  const maxCh = trafficSources.length ? Math.max(...trafficSources.map((c) => c.sessions)) : 0;

  return (
    <section className="space-y-6">
      {/* Header + Time Range Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <h2 className="text-xl font-bold text-white">Google Analytics</h2>
          </div>
          <p className="mt-1 text-sm text-gray-400">สถิติเว็บไซต์จาก Google Analytics 4</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TIME_RANGES.map((tr, idx) => (
            <button
              key={tr.label}
              onClick={() => setRangeIdx(idx)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                rangeIdx === idx
                  ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 shadow-sm"
                  : "border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard label="Sessions" value={fmt(overview.sessions)} subtext="จำนวน session ทั้งหมด" gradient="linear-gradient(135deg, #6366f1, #818cf8)" icon={METRIC_ICONS.sessions} />
        <MetricCard label="Page Views" value={fmt(overview.pageViews)} subtext="จำนวนหน้าที่ถูกเปิดดู" gradient="linear-gradient(135deg, #f59e0b, #fbbf24)" icon={METRIC_ICONS.pageViews} />
        <MetricCard label="Total Users" value={fmt(overview.totalUsers)} subtext="ผู้ใช้ทั้งหมด" gradient="linear-gradient(135deg, #10b981, #34d399)" icon={METRIC_ICONS.totalUsers} />
        <MetricCard label="New Users" value={fmt(overview.newUsers)} subtext="ผู้ใช้ใหม่ในช่วงเวลา" gradient="linear-gradient(135deg, #8b5cf6, #a78bfa)" icon={METRIC_ICONS.newUsers} />
        <MetricCard label="Bounce Rate" value={`${overview.bounceRate.toFixed(1)}%`} subtext="อัตราการตีกลับ" gradient="linear-gradient(135deg, #ef4444, #f87171)" icon={METRIC_ICONS.bounceRate} />
        <MetricCard label="Avg Duration" value={fmtDur(overview.avgSessionDurationSec)} subtext="เวลาเฉลี่ยต่อ session" gradient="linear-gradient(135deg, #14b8a6, #2dd4bf)" icon={METRIC_ICONS.avgDuration} />
      </div>



      {/* Bottom row: Top Pages + Traffic Sources + Devices */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-1 rounded-2xl border border-gray-800 bg-gray-900/60 p-5 shadow-lg shadow-black/20">
          <h3 className="text-sm font-bold text-white uppercase tracking-[0.12em] mb-4">🔥 หน้ายอดนิยม (Top 10)</h3>
          {topPages.length === 0 ? (
            <p className="text-sm text-gray-500">ไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-2">
              {topPages.map((p, i) => (
                <div key={p.path} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-gray-800/40">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-800 text-xs font-bold text-gray-400">{i + 1}</span>
                  <span className="flex-1 truncate text-sm text-gray-300" title={p.path}>{p.path}</span>
                  <span className="shrink-0 text-xs font-semibold text-indigo-300">{fmt(p.views)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-1 rounded-2xl border border-gray-800 bg-gray-900/60 p-5 shadow-lg shadow-black/20">
          <h3 className="text-sm font-bold text-white uppercase tracking-[0.12em] mb-4">📊 แหล่งที่มาของผู้เข้าชม</h3>
          {trafficSources.length === 0 ? (
            <p className="text-sm text-gray-500">ไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-2.5">
              {trafficSources.map((ch, i) => (
                <TrafficBar key={ch.channel} channel={ch.channel} sessions={ch.sessions} maxSessions={maxCh} color={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-1 rounded-2xl border border-gray-800 bg-gray-900/60 p-5 shadow-lg shadow-black/20">
          <h3 className="text-sm font-bold text-white uppercase tracking-[0.12em] mb-4">📱 อุปกรณ์ที่ใช้</h3>
          <DeviceDonut devices={devices} />
        </div>
      </div>
    </section>
  );
}
