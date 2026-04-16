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

export function safeLink(value: unknown): string | null {
  const normalized = nullableString(value);
  if (!normalized) {
    return null;
  }

  if (UNSAFE_SCHEME_RE.test(normalized)) {
    return null;
  }

  if (normalized.startsWith("/") || normalized.startsWith("#") || SAFE_LINK_PREFIX_RE.test(normalized)) {
    return normalized;
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
