/**
 * Lightweight sliding-window in-memory rate limiter for Next.js API Route Handlers.
 * Protects public endpoints (/api/verify-anggota, /api/public-stats) against brute-force & enumeration.
 */

interface RateLimitBucket {
  timestamps: number[];
}

const buckets = new Map<string, RateLimitBucket>();

export interface RateLimitConfig {
  /** Maximum number of requests allowed inside the window */
  limit: number;
  /** Time window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { limit: 30, windowMs: 60_000 },
  now: number = Date.now()
): RateLimitResult {
  const cutoff = now - config.windowMs;
  const existing = buckets.get(key);
  const timestamps = existing ? existing.timestamps.filter((t) => t > cutoff) : [];

  if (timestamps.length >= config.limit) {
    const oldest = timestamps[0] ?? now;
    const resetAt = oldest + config.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
    buckets.set(key, { timestamps });
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterSeconds,
    };
  }

  timestamps.push(now);
  buckets.set(key, { timestamps });

  // Opportunistic cleanup to keep memory bounded in long-lived Node servers
  if (buckets.size > 2000) {
    for (const [k, b] of buckets.entries()) {
      const fresh = b.timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) {
        buckets.delete(k);
      } else {
        b.timestamps = fresh;
      }
    }
  }

  const resetAt = (timestamps[0] ?? now) + config.windowMs;
  return {
    allowed: true,
    remaining: Math.max(0, config.limit - timestamps.length),
    resetAt,
    retryAfterSeconds: 0,
  };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

/** Reset internal buckets (used in tests). */
export function resetRateLimits(): void {
  buckets.clear();
}
