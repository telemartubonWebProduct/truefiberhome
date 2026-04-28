import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { nullableString } from "@/src/lib/api-normalize";
import {
  coerceNonNegativeInt,
  parseDateOnlyInput,
} from "@/src/lib/daily-performance";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";

function getDailyPerformanceLogDelegate() {
  const delegate = (prisma as any).dailyPerformanceLog;
  return typeof delegate?.update === "function" ? delegate : null;
}

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: Context) {
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
    const { id } = await context.params;
    const body = await request.json();

    const data: {
      recordDate?: Date;
      lineLeads?: number;
      phoneLeads?: number;
      facebookLeads?: number;
      salesSuccess?: number;
      installSuccess?: number;
      pendingInstall?: number;
      installFailed?: number;
      waitingDocuments?: number;
      notes?: string | null;
    } = {};

    if ("recordDate" in body) {
      const recordDate = parseDateOnlyInput(body.recordDate);
      if (!recordDate) {
        return NextResponse.json({ error: "recordDate must be in YYYY-MM-DD format" }, { status: 400 });
      }
      data.recordDate = recordDate;
    }

    if ("lineLeads" in body) {
      data.lineLeads = coerceNonNegativeInt(body.lineLeads);
    }

    if ("phoneLeads" in body) {
      data.phoneLeads = coerceNonNegativeInt(body.phoneLeads);
    }

    if ("facebookLeads" in body) {
      data.facebookLeads = coerceNonNegativeInt(body.facebookLeads);
    }

    if ("salesSuccess" in body) {
      data.salesSuccess = coerceNonNegativeInt(body.salesSuccess);
    }

    if ("installSuccess" in body) {
      data.installSuccess = coerceNonNegativeInt(body.installSuccess);
    }

    if ("pendingInstall" in body) {
      data.pendingInstall = coerceNonNegativeInt(body.pendingInstall);
    }

    if ("installFailed" in body) {
      data.installFailed = coerceNonNegativeInt(body.installFailed);
    }

    if ("waitingDocuments" in body) {
      data.waitingDocuments = coerceNonNegativeInt(body.waitingDocuments);
    }

    if ("notes" in body) {
      data.notes = nullableString(body.notes);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
    }

    const updated = await dailyPerformanceLog.update({
      where: { id },
      data,
    });

    revalidatePath("/dashboard/daily-performance");
    revalidatePath("/dashboard/overview");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/daily-performance/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update daily performance" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
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
    const { id } = await context.params;

    await dailyPerformanceLog.delete({ where: { id } });

    revalidatePath("/dashboard/daily-performance");
    revalidatePath("/dashboard/overview");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/daily-performance/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete daily performance" }, { status: 500 });
  }
}
