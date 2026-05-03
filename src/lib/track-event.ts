/* ------------------------------------------------------------------ */
/*  Client-side GA4 Event Tracking Utility                             */
/*  Sends custom events via gtag('event', ...) for button click        */
/*  tracking across the site.                                          */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Send a custom event to GA4 via gtag.
 * Safe to call even if gtag is not loaded (no-op).
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number>,
) {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", eventName, params);
}

/* ---------- Helper functions for specific actions ---------- */

/** Track a click on any LINE link */
export function trackLineClick(source: string, url?: string) {
  trackEvent("line_click", {
    source,
    ...(url ? { link_url: url } : {}),
  });
}

/** Track a click on a phone call button */
export function trackPhoneClick(source: string, phoneNumber?: string) {
  trackEvent("phone_click", {
    source,
    ...(phoneNumber ? { phone_number: phoneNumber } : {}),
  });
}

/** Track a click on a Facebook link */
export function trackFacebookClick(source: string, url?: string) {
  trackEvent("facebook_click", {
    source,
    ...(url ? { link_url: url } : {}),
  });
}

/** Track when a user shows signup interest (clicks "สนใจสมัคร" etc.) */
export function trackSignupInterest(
  source: string,
  promotionName?: string,
) {
  trackEvent("signup_interest", {
    source,
    ...(promotionName ? { promotion_name: promotionName } : {}),
  });
}

/** Track chatbot interactions */
export function trackChatOpen() {
  trackEvent("chat_open", { source: "chat_widget" });
}

export function trackChatSendMessage() {
  trackEvent("chat_send_message", { source: "chat_widget" });
}

export function trackChatQuickAction(actionLabel: string) {
  trackEvent("chat_quick_action", {
    source: "chat_widget",
    action_label: actionLabel,
  });
}

export function trackChatHandoff() {
  trackEvent("chat_handoff", { source: "chat_widget" });
}
