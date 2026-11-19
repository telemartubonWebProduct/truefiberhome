const DEFAULT_SITE_URL = "https://www.truefiberhome.com";

function resolveSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (!raw) return DEFAULT_SITE_URL;

  try {
    const url = new URL(raw);
    // The apex host only redirects to www, so canonical URLs must use www.
    if (url.hostname === "truefiberhome.com") url.hostname = "www.truefiberhome.com";
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/** Canonical origin for metadata, sitemap, robots and structured data. */
export const SITE_URL = resolveSiteUrl();

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? SITE_URL : `${SITE_URL}${normalized}`;
}

/** Splits a stored phone field such as "0639274977 และ 0639234798" into single numbers. */
export function parsePhones(raw?: string | null): string[] {
  if (!raw) return [];

  return raw
    .split(/,|\/|และ|\n/)
    .map((part) => part.trim())
    .filter((part) => part.replace(/\D/g, "").length >= 9);
}

export function telHref(phone: string): string {
  const compact = phone.replace(/[^\d+]/g, "");
  return `tel:${compact}`;
}

/** 0639274977 -> 063-927-4977. Other shapes are returned unchanged. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return phone.trim();
}
