/* ------------------------------------------------------------------ */
/*  Meta Conversions API (server side)                                 */
/*                                                                     */
/*  The server copy of a pixel event, sent with the same event id so  */
/*  Meta keeps one of the two. Only called for visitors who accepted   */
/*  cookies. Off unless both env values are set:                       */
/*    NEXT_PUBLIC_META_PIXEL_ID  the dataset (pixel) id                */
/*    META_CAPI_TOKEN            Events Manager → Settings → Conversions */
/*                               API → Generate access token           */
/*  META_CAPI_TEST_EVENT_CODE (optional) shows events in Test events.  */
/* ------------------------------------------------------------------ */

const GRAPH_VERSION = "v26.0";

export type CapiEvent = {
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  clientIp: string | null;
  userAgent: string | null;
  fbp: string | null;
  fbc: string | null;
  customData?: Record<string, string>;
};

export function capiConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() && process.env.META_CAPI_TOKEN?.trim());
}

/** The request body Meta expects for one website event. */
export function capiPayload(event: CapiEvent, now = Date.now()) {
  const userData: Record<string, string> = {};
  if (event.clientIp) userData.client_ip_address = event.clientIp;
  if (event.userAgent) userData.client_user_agent = event.userAgent;
  if (event.fbp) userData.fbp = event.fbp;
  if (event.fbc) userData.fbc = event.fbc;
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  return {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(now / 1000),
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        action_source: "website",
        user_data: userData,
        ...(event.customData ? { custom_data: event.customData } : {}),
      },
    ],
    ...(testCode ? { test_event_code: testCode } : {}),
  };
}

/** Sends one event; failures are logged (never the token) and never thrown. */
export async function sendCapiEvent(event: CapiEvent): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const token = process.env.META_CAPI_TOKEN?.trim();
  if (!pixelId || !token) return;
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(capiPayload(event)),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[meta-capi] ${event.eventName} → ${res.status}`, detail.slice(0, 300));
    }
  } catch (error) {
    console.error(`[meta-capi] ${event.eventName} failed:`, error instanceof Error ? error.message : error);
  }
}

/** First address in x-forwarded-for (Vercel puts the visitor first). */
export function clientIpFrom(forwardedFor: string | null, realIp: string | null): string | null {
  const first = forwardedFor?.split(",")[0]?.trim();
  return first || realIp?.trim() || null;
}
