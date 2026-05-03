import { google } from "googleapis";
import fs from "fs";
import path from "path";

/* ------------------------------------------------------------------ */
/*  Google Analytics 4 Data API – server-side helper (REST-based)      */
/*  Uses `googleapis` package instead of gRPC `@google-analytics/data` */
/* ------------------------------------------------------------------ */

/** Lazily-initialised auth client (singleton) */
let _auth: InstanceType<typeof google.auth.GoogleAuth> | null = null;

function getAuth() {
  if (_auth) return _auth;

  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

  if (keyJson) {
    // ✅ วิธีแนะนำ: เก็บ JSON content ใน env var โดยตรง (ปลอดภัย, ไม่ต้องมีไฟล์บน server)
    try {
      const credentials = JSON.parse(keyJson);
      _auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
      });
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON");
    }
  } else if (keyPath) {
    // วิธีเก่า: อ่านจากไฟล์ (ใช้ได้แค่ตอน dev local)
    const resolvedPath = path.resolve(keyPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Service account key file not found: ${resolvedPath}`);
    }
    _auth = new google.auth.GoogleAuth({
      keyFile: resolvedPath,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
  } else {
    // Fallback: ใช้ Application Default Credentials (สำหรับ GCP)
    _auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
  }

  return _auth;
}

/* ---------- Types ---------- */

export interface AnalyticsOverview {
  sessions: number;
  pageViews: number;
  totalUsers: number;
  newUsers: number;
  bounceRate: number;         // 0-100
  avgSessionDurationSec: number;
}

export interface PageMetric {
  path: string;
  views: number;
}

export interface ChannelMetric {
  channel: string;
  sessions: number;
}

export interface DeviceMetric {
  device: string;
  sessions: number;
}

export interface AnalyticsSummary {
  overview: AnalyticsOverview;
  topPages: PageMetric[];
  trafficSources: ChannelMetric[];
  devices: DeviceMetric[];
}

/* ---------- REST API helpers ---------- */

const PROPERTY_ID = () => process.env.GA_PROPERTY_ID ?? "";

interface GARunReportRequest {
  dateRanges: { startDate: string; endDate: string }[];
  metrics: { name: string }[];
  dimensions?: { name: string }[];
  orderBys?: { metric: { metricName: string }; desc: boolean }[];
  limit?: number;
}

interface GARow {
  dimensionValues?: { value: string }[];
  metricValues?: { value: string }[];
}

interface GARunReportResponse {
  rows?: GARow[];
}

async function runReport(request: GARunReportRequest): Promise<GARunReportResponse> {
  const auth = getAuth();
  const accessToken = await auth.getAccessToken();
  const pid = PROPERTY_ID();

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${pid}:runReport`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[GA] API error ${res.status}: ${body}`);

    // Parse for user-friendly message
    try {
      const errJson = JSON.parse(body);
      const msg = errJson?.error?.message || body;
      const status = errJson?.error?.status || "";

      if (res.status === 403 || status === "PERMISSION_DENIED") {
        throw new Error(
          `Service Account ไม่มีสิทธิ์เข้าถึง GA Property ${pid} — ` +
          `กรุณาเพิ่ม service account เป็น Viewer ใน Google Analytics → Admin → Property Access Management`,
        );
      }
      if (res.status === 404 || status === "NOT_FOUND") {
        throw new Error(
          `ไม่พบ GA Property ID "${pid}" — กรุณาตรวจสอบว่า GA_PROPERTY_ID ในไฟล์ .env ถูกต้อง`,
        );
      }

      throw new Error(`GA API error: ${msg}`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("GA API error")) throw e;
      if (e instanceof Error && e.message.includes("Service Account")) throw e;
      if (e instanceof Error && e.message.includes("ไม่พบ")) throw e;
      throw new Error(`GA API error (${res.status}): ${body}`);
    }
  }

  return res.json();
}

/**
 * Fetch a full analytics summary for the given date range.
 * Dates must be in YYYY-MM-DD format or relative strings like 'today', '30daysAgo'.
 */
export async function getAnalyticsSummary(
  startDate: string,
  endDate: string,
): Promise<AnalyticsSummary> {
  const pid = PROPERTY_ID();
  console.log(`[GA] Fetching analytics for property ${pid}, range: ${startDate} → ${endDate}`);

  // Run all four reports in parallel
  const [overviewRes, pagesRes, channelsRes, devicesRes] = await Promise.all([
    // 1) Overview metrics
    runReport({
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    }),

    // 2) Top pages
    runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    }),

    // 3) Traffic sources / channels
    runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8,
    }),

    // 4) Device categories
    runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
  ]);

  // --- Parse overview ---
  const oRow = overviewRes.rows?.[0];
  const mv = (i: number) => Number(oRow?.metricValues?.[i]?.value ?? 0);
  const overview: AnalyticsOverview = {
    sessions: mv(0),
    pageViews: mv(1),
    totalUsers: mv(2),
    newUsers: mv(3),
    bounceRate: Math.round(mv(4) * 100) / 100,
    avgSessionDurationSec: Math.round(mv(5)),
  };

  // --- Parse top pages ---
  const topPages: PageMetric[] = (pagesRes.rows ?? []).map((r) => ({
    path: r.dimensionValues?.[0]?.value ?? "",
    views: Number(r.metricValues?.[0]?.value ?? 0),
  }));

  // --- Parse traffic sources ---
  const trafficSources: ChannelMetric[] = (channelsRes.rows ?? []).map((r) => ({
    channel: r.dimensionValues?.[0]?.value ?? "",
    sessions: Number(r.metricValues?.[0]?.value ?? 0),
  }));

  // --- Parse devices ---
  const devices: DeviceMetric[] = (devicesRes.rows ?? []).map((r) => ({
    device: r.dimensionValues?.[0]?.value ?? "",
    sessions: Number(r.metricValues?.[0]?.value ?? 0),
  }));

  return { overview, topPages, trafficSources, devices };
}

/* ---------- Event Tracking Reports ---------- */

export interface EventMetric {
  eventName: string;
  count: number;
}

export interface EventSourceBreakdown {
  eventName: string;
  source: string;
  count: number;
}

export interface EventsSummary {
  events: EventMetric[];
  breakdown: EventSourceBreakdown[];
}

const TRACKED_EVENTS = [
  "line_click",
  "phone_click",
  "facebook_click",
  "signup_interest",
  "chat_open",
  "chat_send_message",
  "chat_quick_action",
  "chat_handoff",
];

/**
 * Fetch event counts and breakdowns for tracked custom events.
 */
export async function getEventsSummary(
  startDate: string,
  endDate: string,
): Promise<EventsSummary> {
  const pid = PROPERTY_ID();
  console.log(`[GA] Fetching events for property ${pid}, range: ${startDate} → ${endDate}`);

  // Run two reports in parallel: totals per event and breakdown by source
  const [totalsRes, breakdownRes] = await Promise.all([
    // 1) Total count per eventName
    runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 50,
    }),

    // 2) Breakdown by eventName + page path (which page the user clicked from)
    runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: "eventName" },
        { name: "pagePath" },
      ],
      metrics: [{ name: "eventCount" }],
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 100,
    }),
  ]);

  // Parse totals — filter only tracked events
  const events: EventMetric[] = (totalsRes.rows ?? [])
    .filter((r) => TRACKED_EVENTS.includes(r.dimensionValues?.[0]?.value ?? ""))
    .map((r) => ({
      eventName: r.dimensionValues?.[0]?.value ?? "",
      count: Number(r.metricValues?.[0]?.value ?? 0),
    }));

  // Ensure all tracked events exist (even with 0 count)
  for (const ev of TRACKED_EVENTS) {
    if (!events.find((e) => e.eventName === ev)) {
      events.push({ eventName: ev, count: 0 });
    }
  }

  // Parse breakdown — filter only tracked events
  const breakdown: EventSourceBreakdown[] = (breakdownRes.rows ?? [])
    .filter((r) => TRACKED_EVENTS.includes(r.dimensionValues?.[0]?.value ?? ""))
    .map((r) => ({
      eventName: r.dimensionValues?.[0]?.value ?? "",
      source: r.dimensionValues?.[1]?.value ?? "(not set)",
      count: Number(r.metricValues?.[0]?.value ?? 0),
    }));

  return { events, breakdown };
}
