import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { nullableString } from "@/src/lib/api-normalize";
import {
  coerceNonNegativeInt,
  getMonthDateRange,
  normalizeMonthKey,
  parseDateOnlyInput,
  summarizeDailyPerformance,
} from "@/src/lib/daily-performance";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";

function getDailyPerformanceLogDelegate() {
  const delegate = (prisma as any).dailyPerformanceLog;
  return typeof delegate?.findMany === "function" ? delegate : null;
}

export async function GET(request: NextRequest) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  const dailyPerformanceLog = getDailyPerformanceLogDelegate();
  if (!dailyPerformanceLog) {
    return NextResponse.json(
      {
        error:
          "Daily performance table is unavailable. Run Prisma migrate/db push, generate client, and restart dev server.",
      },
      { status: 503 }
    );
  }

  try {
    const month = normalizeMonthKey(request.nextUrl.searchParams.get("month"));
    const { startDate, endDate } = getMonthDateRange(month);

    const rows = await dailyPerformanceLog.findMany({
      where: {
        recordDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: {
        recordDate: "asc",
      },
    });

    return NextResponse.json({
      month,
      items: rows,
      summary: summarizeDailyPerformance(rows),
    });
  } catch (error) {
    console.error("GET /api/daily-performance failed:", error);
    return NextResponse.json({ error: "Failed to load daily performance" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  const dailyPerformanceLog = getDailyPerformanceLogDelegate();
  if (!dailyPerformanceLog) {
    return NextResponse.json(
      {
        error:
          "Daily performance table is unavailable. Run Prisma migrate/db push, generate client, and restart dev server.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    const recordDate = parseDateOnlyInput(body.recordDate);
    if (!recordDate) {
      return NextResponse.json({ error: "recordDate must be in YYYY-MM-DD format" }, { status: 400 });
    }

    const payload = {
      lineLeads: coerceNonNegativeInt(body.lineLeads),
      phoneLeads: coerceNonNegativeInt(body.phoneLeads),
      facebookLeads: coerceNonNegativeInt(body.facebookLeads),
      salesSuccess: coerceNonNegativeInt(body.salesSuccess),
      installSuccess: coerceNonNegativeInt(body.installSuccess),
      pendingInstall: coerceNonNegativeInt(body.pendingInstall),
      installFailed: coerceNonNegativeInt(body.installFailed),
      waitingDocuments: coerceNonNegativeInt(body.waitingDocuments),
      notes: nullableString(body.notes),
    };

    const saved = await dailyPerformanceLog.upsert({
      where: { recordDate },
      create: {
        recordDate,
        ...payload,
      },
      update: payload,
    });

    revalidatePath("/dashboard/daily-performance");
    revalidatePath("/dashboard/overview");

    return NextResponse.json(saved);
  } catch (error) {
    console.error("POST /api/daily-performance failed:", error);
    return NextResponse.json({ error: "Failed to save daily performance" }, { status: 500 });
  }
}
