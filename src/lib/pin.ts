// Config and helpers for the /pin page, where a customer who came from a
// Messenger chat sends their home location back into that chat.
// Coordinates never leave the browser: they are only copied to the clipboard.

export type PinPageKey = "tt" | "tas";

export type PinPage = {
  key: PinPageKey;
  pageId: string;
  /** Name shown in the page header. */
  brand: string;
};

export const PIN_PAGES: Record<PinPageKey, PinPage> = {
  // True Telemart. The header uses the neutral reseller label on purpose.
  tt: { key: "tt", pageId: "547968391728736", brand: "ตัวแทนทรูออนไลน์" },
  // True All Star belongs to Clean House Energy, not Telemart:
  // nothing on this variant may carry the Telemart name or logo.
  tas: { key: "tas", pageId: "127725476907107", brand: "True All Star" },
};

/** Unknown or missing values fall back to True Telemart. */
export function resolvePinPage(value: string | string[] | undefined | null): PinPage {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "tas" ? PIN_PAGES.tas : PIN_PAGES.tt;
}

/** m.me accepts the numeric Page ID (checked 2026-11-21: 302 to m.facebook.com/msg/<id>). */
export function messengerUrl(page: PinPage): string {
  return `https://m.me/${page.pageId}`;
}

export function formatCoord(value: number): string {
  return value.toFixed(6);
}

export function buildPinMessage(lat: number, lng: number): string {
  return `📍 พิกัดบ้านที่จะติดตั้งค่ะ\nhttps://maps.google.com/?q=${formatCoord(lat)},${formatCoord(lng)}`;
}

/** Accuracy above this (metres) asks the customer to drag the pin onto the house. */
export const LOW_ACCURACY_METERS = 100;

/** Centre of Thailand, used when the location is not available. */
export const THAILAND_VIEW = { lat: 13.2, lng: 101.0, zoom: 5 } as const;

/**
 * Messenger and Facebook's in-app browser on Android refuse the location without
 * ever asking the customer, so on Android the page hands over to Chrome instead.
 */
export function isAndroidInAppBrowser(userAgent: string): boolean {
  return /Android/i.test(userAgent) && /FBAN|FBAV|FB_IAB|FB4A|Orca|Messenger|Instagram|Line\//i.test(userAgent);
}

/** Query flag that makes the page ask for the location as soon as it opens. */
export const AUTO_LOCATE_PARAM = "go";

/**
 * Android intent link that opens this page in Chrome and asks for the location at once.
 * Without Chrome, Android opens the fallback (the same page without the flag).
 */
export function chromeIntentUrl(origin: string, page: PinPage): string {
  const url = new URL(origin);
  const path = `/pin?p=${page.key}`;
  const fallback = `${url.origin}${path}`;
  return (
    `intent://${url.host}${path}&${AUTO_LOCATE_PARAM}=1` +
    `#Intent;scheme=${url.protocol.replace(":", "")};package=com.android.chrome;` +
    `S.browser_fallback_url=${encodeURIComponent(fallback)};end`
  );
}

export type PinEventName =
  | "pin_open"
  | "pin_open_chrome"
  | "pin_locate_ok"
  | "pin_locate_denied"
  | "pin_copy"
  | "pin_back_to_chat";
