import type { Env } from './types.js';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * In-memory sliding window rate limiter.
 *
 * Uses a Map with automatic window rotation.
 * Counters reset on Worker cold start — acceptable for rate limiting
 * since the goal is abuse prevention, not precise accounting.
 *
 * Why not KV: KV.put on every request hits the 1,000 writes/day
 * free tier limit instantly on heavy-asset pages (Angular/React dev servers).
 *
 * Rates:
 * - Per tunnel: 1,000 requests/hour
 * - Per IP (anonymous): 200 requests/minute
 * - Per user (authenticated): 5,000 requests/hour
 */

const counters = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  _env: Env,
  scope: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Math.floor(Date.now() / 1000);
  const windowEnd = (Math.floor(now / windowSeconds) + 1) * windowSeconds;
  const key = `rate:${scope}`;

  const entry = counters.get(key);

  // Window expired or first request — reset counter
  if (!entry || now >= entry.resetAt) {
    counters.set(key, { count: 1, resetAt: windowEnd });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: windowEnd,
    };
  }

  // Over limit
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment
  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// ─── Rate limit scopes and limits ─────────────────────

export const RATE_LIMITS = {
  /** Per tunnel: 1,000 requests per hour */
  tunnel: (subdomain: string, domain: string) => ({
    scope: `tunnel:${domain}:${subdomain}`,
    limit: 1000,
    windowSeconds: 3600,
  }),

  /** Per IP (anonymous): 200 requests per minute */
  anonymousIp: (ip: string) => ({
    scope: `ip:${ip}`,
    limit: 200,
    windowSeconds: 60,
  }),

  /** Per user (authenticated): 5,000 requests per hour */
  user: (userId: string) => ({
    scope: `user:${userId}`,
    limit: 5000,
    windowSeconds: 3600,
  }),
} as const;
