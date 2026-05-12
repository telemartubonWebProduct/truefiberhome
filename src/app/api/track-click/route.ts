import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/track-click                                              */
/*  Records a button-click event to the database (fire-and-forget).    */
/*  Public endpoint — no auth required (called from visitor browsers).  */
/* ------------------------------------------------------------------ */

const ALLOWED_EVENTS = new Set([
  "line_click",
  "phone_click",
  "facebook_click",
  "signup_interest",
]);

interface TrackClickBody {
  eventName?: string;
  source?: string;
  url?: string;
  pagePath?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TrackClickBody;

    const eventName = typeof body.eventName === "string" ? body.eventName.trim() : "";
    const source = typeof body.source === "string" ? body.source.trim() : "";

    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json(
        { error: "Invalid eventName" },
        { status: 400 },
      );
    }

    if (!source) {
      return NextResponse.json(
        { error: "source is required" },
        { status: 400 },
      );
    }

    const url = typeof body.url === "string" ? body.url.trim() || null : null;
    const pagePath = typeof body.pagePath === "string" ? body.pagePath.trim() || null : null;

    await (prisma as any).clickEvent.create({
      data: {
        eventName,
        source,
        url,
        pagePath,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[track-click] Failed to record event:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
