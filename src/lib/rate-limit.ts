import { NextResponse } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
  touchedAt: number;
};

type RequestRateLimitConfig = {
  scope: string;
  limit: number;
  windowMs: number;
  identifier?: string | null;
  message?: string;
};

const MAX_BUCKETS = 5000;
const buckets = new Map<string, RateLimitBucket>();

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown-ip"
  );
}

function normalizeIdentity(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

function buildRateLimitIdentity(request: Request, explicitIdentifier: string | null | undefined) {
  if (explicitIdentifier && explicitIdentifier.trim()) {
    return normalizeIdentity(explicitIdentifier);
  }

  const visitorId = request.headers.get("x-chat-visitor-id")?.trim();
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent")?.trim() || "unknown-ua";

  if (visitorId) {
    return normalizeIdentity(`visitor:${visitorId}|ip:${ip}`);
  }

  return normalizeIdentity(`ip:${ip}|ua:${userAgent.slice(0, 80)}`);
}

function pruneBuckets(now: number) {
  if (buckets.size === 0) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  if (buckets.size <= MAX_BUCKETS) {
    return;
  }

  const entries = Array.from(buckets.entries()).sort(
    (left, right) => left[1].touchedAt - right[1].touchedAt
  );

  const overflow = buckets.size - MAX_BUCKETS;
  for (let index = 0; index < overflow; index += 1) {
    const target = entries[index];
    if (!target) {
      break;
    }

    buckets.delete(target[0]);
  }
}

export function applyRequestRateLimit(request: Request, config: RequestRateLimitConfig) {
  if (config.limit <= 0 || config.windowMs <= 0) {
    return null;
  }

  const now = Date.now();
  pruneBuckets(now);

  const identity = buildRateLimitIdentity(request, config.identifier);
  const key = `${config.scope}:${identity}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
      touchedAt: now,
    });

    return null;
  }

  existing.count += 1;
  existing.touchedAt = now;

  if (existing.count <= config.limit) {
    return null;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return NextResponse.json(
    {
      error: config.message || "Too many requests",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(config.limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}