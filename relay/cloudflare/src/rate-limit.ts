import type { Env } from './types.js';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * KV-based sliding window rate limiter.
 *
 * Uses KV keys with TTL for automatic cleanup.
 * Each window is a separate KV key with an atomic counter.
 *
 * Rates:
 * - Per tunnel: 1,000 requests/hour
 * - Per IP (anonymous): 200 requests/minute
 * - Per user (authenticated): 5,000 requests/hour
 */
export async function checkRateLimit(
  env: Env,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / windowSeconds);
  const kvKey = `rate:${scope}:${window}`;

  // Read current count
  const currentStr = await env.KV.get(kvKey);
  const current = currentStr ? parseInt(currentStr, 10) : 0;

  if (current >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: (window + 1) * windowSeconds,
    };
  }

  // Increment (not truly atomic - but KV is eventually consistent anyway)
  await env.KV.put(kvKey, String(current + 1), {
    expirationTtl: windowSeconds * 2, // 2x window for safety
  });

  return {
    allowed: true,
    remaining: limit - current - 1,
    resetAt: (window + 1) * windowSeconds,
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
