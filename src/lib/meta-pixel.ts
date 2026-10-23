/* ------------------------------------------------------------------ */
/*  Meta Pixel (browser side)                                          */
/*                                                                     */
/*  Loaded by ConsentAnalytics only on the production deploy and only  */
/*  after the visitor accepts cookies. Each event carries an id that   */
/*  /api/track-click also sends to the Conversions API, so Meta counts */
/*  the browser and the server copy once.                              */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Public Pixel (dataset) id; empty leaves the pixel off. */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";

/** Meta's standard events, plus our own for a "สนใจสมัคร" click. */
export type MetaEventName = "Contact" | "Lead" | "SignupInterest";

const STANDARD_EVENTS = new Set<MetaEventName>(["Contact", "Lead"]);

/** Meta event for each tracked click: a LINE/phone/Facebook click is the visitor contacting us. */
export const CLICK_META_EVENTS: Record<string, MetaEventName> = {
  line_click: "Contact",
  phone_click: "Contact",
  facebook_click: "Contact",
  signup_interest: "SignupInterest",
};

/** Id shared by the browser event and its server copy. */
export function newEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Whether the visitor accepted cookies on this browser. */
export function hasTrackingConsent(consentKey: string): boolean {
  try {
    return window.localStorage.getItem(consentKey) === "true";
  } catch {
    return false;
  }
}

/** Sends one event to the pixel when it is loaded; nothing otherwise. */
export function trackMetaEvent(
  eventName: MetaEventName,
  params: Record<string, string>,
  eventId: string,
) {
  if (typeof window === "undefined" || !window.fbq) return;
  const kind = STANDARD_EVENTS.has(eventName) ? "track" : "trackCustom";
  window.fbq(kind, eventName, params, { eventID: eventId });
}

/** The pixel's base code: queue calls until fbevents.js arrives, then init and count the page view. */
export function metaPixelSnippet(pixelId: string): string {
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(pixelId)});
fbq('track', 'PageView');`;
}
