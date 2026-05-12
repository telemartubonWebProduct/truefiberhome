import { NextRequest, NextResponse } from "next/server";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/click-stats                                               */
/*  Returns aggregated click event statistics for the dashboard.       */
/*  Protected — requires dashboard authentication.                     */
/* ------------------------------------------------------------------ */

const EVENT_NAMES = [
  "line_click",
  "phone_click",
  "facebook_click",
  "signup_interest",
] as const;

type EventName = (typeof EVENT_NAMES)[number];

interface DailyRow {
  date: string;
  line_click: number;
  phone_click: number;
  facebook_click: number;
  signup_interest: number;
}

interface EventTotal {
  eventName: string;
  count: number;
}

interface ClickStatsResponse {
  totals: EventTotal[];
  daily: DailyRow[];
  todayTotals: EventTotal[];
}

function getDateRange(period: string): { since: Date; label: string } {
  const now = new Date();
  // Use Bangkok timezone for day boundaries
  const bangkokNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );

  const todayStart = new Date(bangkokNow);
  todayStart.setHours(0, 0, 0, 0);

  switch (period) {
    case "today":
      return { since: todayStart, label: "วันนี้" };
    case "7days": {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 6);
      return { since: d, label: "7 วัน" };
    }
    case "30days": {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 29);
      return { since: d, label: "30 วัน" };
    }
    case "all":
      return { since: new Date("2020-01-01"), label: "ทั้งหมด" };
    default: {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 29);
      return { since: d, label: "30 วัน" };
    }
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const sp = request.nextUrl.searchParams;
    const period = sp.get("period") || "30days";
    const { since } = getDateRange(period);

    const clickEventDelegate = (prisma as any).clickEvent;
    if (typeof clickEventDelegate?.findMany !== "function") {
      return NextResponse.json(
        { error: "ClickEvent table not available" },
        { status: 503 },
      );
    }

    // 1) Total counts per event within date range
    const totals: EventTotal[] = await Promise.all(
      EVENT_NAMES.map(async (eventName) => {
        const count = await clickEventDelegate.count({
          where: {
            eventName,
            createdAt: { gte: since },
          },
        });
        return { eventName, count };
      }),
    );

    // 2) Today's totals
    const now = new Date();
    const bangkokNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
    );
    const todayStart = new Date(bangkokNow);
    todayStart.setHours(0, 0, 0, 0);

    const todayTotals: EventTotal[] = await Promise.all(
      EVENT_NAMES.map(async (eventName) => {
        const count = await clickEventDelegate.count({
          where: {
            eventName,
            createdAt: { gte: todayStart },
          },
        });
        return { eventName, count };
      }),
    );

    // 3) Daily breakdown (last 14 days or within period, whichever is more recent)
    const fourteenDaysAgo = new Date(bangkokNow);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const dailySince = since > fourteenDaysAgo ? since : fourteenDaysAgo;

    const rawEvents = await clickEventDelegate.findMany({
      where: {
        createdAt: { gte: dailySince },
        eventName: { in: [...EVENT_NAMES] },
      },
      select: {
        eventName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by date (Bangkok timezone)
    const dailyMap = new Map<string, Record<EventName, number>>();

    for (const ev of rawEvents) {
      const dateStr = new Date(ev.createdAt).toLocaleDateString("en-CA", {
        timeZone: "Asia/Bangkok",
      }); // YYYY-MM-DD

      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          line_click: 0,
          phone_click: 0,
          facebook_click: 0,
          signup_interest: 0,
        });
      }

      const bucket = dailyMap.get(dateStr)!;
      if (ev.eventName in bucket) {
        bucket[ev.eventName as EventName] += 1;
      }
    }

    // Fill in missing days within the range
    const daily: DailyRow[] = [];
    const cursor = new Date(dailySince);

    while (cursor <= bangkokNow) {
      const dateStr = cursor.toLocaleDateString("en-CA", {
        timeZone: "Asia/Bangkok",
      });
      const counts = dailyMap.get(dateStr) || {
        line_click: 0,
        phone_click: 0,
        facebook_click: 0,
        signup_interest: 0,
      };

      daily.push({
        date: dateStr,
        ...counts,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    const response: ClickStatsResponse = {
      totals,
      todayTotals,
      daily,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[click-stats] Failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch click stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
