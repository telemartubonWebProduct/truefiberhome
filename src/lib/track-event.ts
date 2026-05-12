/* ------------------------------------------------------------------ */
/*  Client-side Event Tracking Utility                                 */
/*                                                                     */
/*  Button clicks (LINE, Phone, Facebook, Signup) → POST to our DB     */
/*  Chat events → gtag (Google Analytics 4)                            */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/* ========== Internal: DB-based tracking (button clicks) ========== */

/**
 * Send a click event to our backend database.
 * Uses `navigator.sendBeacon` when available (survives page navigations),
 * falls back to `fetch` with keepalive.
 */
function sendClickEvent(
  eventName: string,
  source: string,
  url?: string,
) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    eventName,
    source,
    url: url || null,
    pagePath: window.location.pathname,
  });

  // sendBeacon is the most reliable for click-then-navigate scenarios
  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    const sent = navigator.sendBeacon("/api/track-click", blob);
    if (sent) return;
  }

  // Fallback: fetch with keepalive (fire-and-forget)
  fetch("/api/track-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Silently ignore — tracking should never block user actions
  });
}

/* ========== Internal: GA4 tracking (chat events only) ========== */

function trackGA4Event(
  eventName: string,
  params?: Record<string, string | number>,
) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, params);
}

/* ========== Public API: Button click tracking (→ Database) ========== */

/** Track a click on any LINE link */
export function trackLineClick(source: string, url?: string) {
  sendClickEvent("line_click", source, url);
}

/** Track a click on a phone call button */
export function trackPhoneClick(source: string, phoneNumber?: string) {
  sendClickEvent("phone_click", source, phoneNumber ? `tel:${phoneNumber}` : undefined);
}

/** Track a click on a Facebook link */
export function trackFacebookClick(source: string, url?: string) {
  sendClickEvent("facebook_click", source, url);
}

/** Track when a user shows signup interest (clicks "สนใจสมัคร" etc.) */
export function trackSignupInterest(source: string, promotionName?: string) {
  sendClickEvent("signup_interest", source, promotionName);
}

/* ========== Public API: Chat tracking (→ Google Analytics 4) ========== */

export function trackChatOpen() {
  trackGA4Event("chat_open", { source: "chat_widget" });
}

export function trackChatSendMessage() {
  trackGA4Event("chat_send_message", { source: "chat_widget" });
}

export function trackChatQuickAction(actionLabel: string) {
  trackGA4Event("chat_quick_action", {
    source: "chat_widget",
    action_label: actionLabel,
  });
}

export function trackChatHandoff() {
  trackGA4Event("chat_handoff", { source: "chat_widget" });
}
