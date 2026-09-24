// Fixed-window, in-memory rate limiter.
// Per instance only: on serverless each warm instance counts separately, so this
// caps abuse per instance rather than globally. Swap for a shared store
// (e.g. Upstash Redis) before relying on it as a hard limit.

type Window = { count: number; resetAt: number };

const MAX_TRACKED_KEYS = 10_000; // bound memory under a spray of distinct IPs
const windows = new Map<string, Window>();

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let entry = windows.get(key);

  if (!entry || entry.resetAt <= now) {
    if (windows.size >= MAX_TRACKED_KEYS) {
      for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
      if (windows.size >= MAX_TRACKED_KEYS) {
        return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil(windowMs / 1000) }; // shed load
      }
    }
    entry = { count: 0, resetAt: now + windowMs };
    windows.set(key, entry);
  }

  entry.count += 1;
  return {
    ok: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/** Best-effort client IP. Trust x-forwarded-for only behind a proxy that sets it (Vercel, a load balancer). */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
