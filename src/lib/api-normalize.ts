export function nullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const UNSAFE_SCHEME_RE = /^(javascript|data|vbscript|file):/i;
const SAFE_LINK_PREFIX_RE = /^(https?:|mailto:|tel:)/i;
const SAFE_ASSET_PREFIX_RE = /^https?:/i;
const TEL_LINK_PREFIX_RE = /^tel:/i;
const RAW_USSD_RE = /^\*[\d*]+#$/;
const SAFE_TEL_TARGET_RE = /^[0-9+*#(),;pw.-]+$/i;

function encodeTelHash(value: string): string {
  return value.replace(/#/g, "%23");
}

function normalizeTelTarget(raw: string): string | null {
  const decoded = raw.replace(/%23/gi, "#").replace(/%2A/gi, "*");
  const compact = decoded.replace(/\s+/g, "");
  if (!compact || !SAFE_TEL_TARGET_RE.test(compact)) {
    return null;
  }

  return `tel:${encodeTelHash(compact)}`;
}

function normalizeRawUssd(raw: string): string | null {
  const compact = raw.replace(/\s+/g, "");
  if (!RAW_USSD_RE.test(compact)) {
    return null;
  }

  return `tel:${encodeTelHash(compact)}`;
}

export function safeLink(value: unknown): string | null {
  const normalized = nullableString(value);
  if (!normalized) {
    return null;
  }

  if (UNSAFE_SCHEME_RE.test(normalized)) {
    return null;
  }

  if (normalized.startsWith("/") || normalized.startsWith("#")) {
    return normalized;
  }

  if (TEL_LINK_PREFIX_RE.test(normalized)) {
    return normalizeTelTarget(normalized.slice(4));
  }

  if (SAFE_LINK_PREFIX_RE.test(normalized)) {
    return normalized;
  }

  const ussdLink = normalizeRawUssd(normalized);
  if (ussdLink) {
    return ussdLink;
  }

  return null;
}

export function safeAssetUrl(value: unknown): string | null {
  const normalized = nullableString(value);
  if (!normalized) {
    return null;
  }

  if (UNSAFE_SCHEME_RE.test(normalized)) {
    return null;
  }

  if (normalized.startsWith("/") || SAFE_ASSET_PREFIX_RE.test(normalized)) {
    return normalized;
  }

  return null;
}

export function safeString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value;
}

export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function safeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

export function toIntId(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}
