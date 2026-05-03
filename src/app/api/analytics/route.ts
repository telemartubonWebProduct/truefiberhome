import { NextResponse, type NextRequest } from "next/server";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { getAnalyticsSummary, getEventsSummary } from "@/src/lib/google-analytics";

export async function GET(request: NextRequest) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId) {
    return NextResponse.json(
      { error: "GA_PROPERTY_ID is not configured in environment variables." },
      { status: 503 },
    );
  }

  try {
    const sp = request.nextUrl.searchParams;
    const startDate = sp.get("startDate") || "30daysAgo";
    const endDate = sp.get("endDate") || "today";

    const [summary, events] = await Promise.all([
      getAnalyticsSummary(startDate, endDate),
      getEventsSummary(startDate, endDate),
    ]);

    return NextResponse.json({ ...summary, ...events });
  } catch (error: unknown) {
    console.error("GET /api/analytics failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch analytics";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
