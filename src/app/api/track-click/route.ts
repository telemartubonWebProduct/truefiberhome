import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { capiConfigured, clientIpFrom, sendCapiEvent } from "@/src/lib/meta-capi";
import { CLICK_META_EVENTS } from "@/src/lib/meta-pixel";

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

const EVENT_ID = /^[A-Za-z0-9-]{8,64}$/;

interface TrackClickBody {
  eventName?: string;
  source?: string;
  url?: string;
  pagePath?: string;
  /** Shared with the browser pixel event, so Meta keeps one of the two. */
  eventId?: string;
  /** The visitor accepted cookies (only then does anything go to Meta). */
  consent?: boolean;
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

    const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
    if (body.consent === true && EVENT_ID.test(eventId) && capiConfigured() && process.env.VERCEL_ENV === "production") {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.truefiberhome.com";
      const capiEvent = {
        eventName: CLICK_META_EVENTS[eventName],
        eventId,
        eventSourceUrl: new URL(pagePath && pagePath.startsWith("/") ? pagePath : "/", siteUrl).toString(),
        clientIp: clientIpFrom(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip")),
        userAgent: request.headers.get("user-agent"),
        fbp: request.cookies.get("_fbp")?.value ?? null,
        fbc: request.cookies.get("_fbc")?.value ?? null,
        customData: { content_name: source, contact_method: eventName.replace("_click", "") },
      };
      // After the answer is sent: the visitor never waits for Meta.
      after(() => sendCapiEvent(capiEvent));
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[track-click] Failed to record event:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
