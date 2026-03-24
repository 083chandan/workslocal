import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkRateLimit, RATE_LIMITS } from '../src/rate-limit.js';
import type { Env } from '../src/types.js';

const mockEnv = {} as Env;

// ---- checkRateLimit -- sliding window counter ----

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the configured limit', () => {
    const result = checkRateLimit(mockEnv, 'under-limit-test', 5, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('returns remaining count that decreases with each call', () => {
    const scope = 'remaining-decrease-test';
    const limit = 5;

    for (let i = 0; i < limit; i++) {
      const result = checkRateLimit(mockEnv, scope, limit, 60);
      expect(result.remaining).toBe(limit - 1 - i);
    }
  });

  it('blocks requests when count exceeds limit', () => {
    const scope = 'exceed-limit-test';
    const limit = 3;

    for (let i = 0; i < limit; i++) {
      checkRateLimit(mockEnv, scope, limit, 60);
    }

    const blocked = checkRateLimit(mockEnv, scope, limit, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('resets counter after window expires', () => {
    const scope = 'window-expiry-test';
    const limit = 2;
    const windowSeconds = 60;

    checkRateLimit(mockEnv, scope, limit, windowSeconds);
    checkRateLimit(mockEnv, scope, limit, windowSeconds);

    const blocked = checkRateLimit(mockEnv, scope, limit, windowSeconds);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(windowSeconds * 1000);

    const afterReset = checkRateLimit(mockEnv, scope, limit, windowSeconds);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(limit - 1);
  });

  it('isolates counts between different scope strings', () => {
    const scopeA = 'isolation-scope-a';
    const scopeB = 'isolation-scope-b';
    const limit = 3;

    for (let i = 0; i < limit; i++) {
      checkRateLimit(mockEnv, scopeA, limit, 60);
    }
    expect(checkRateLimit(mockEnv, scopeA, limit, 60).allowed).toBe(false);

    const resultB = checkRateLimit(mockEnv, scopeB, limit, 60);
    expect(resultB.allowed).toBe(true);
    expect(resultB.remaining).toBe(limit - 1);
  });

  it('returns a resetAt timestamp in the future', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const result = checkRateLimit(mockEnv, 'resetat-test', 10, 60);
    expect(result.resetAt).toBeGreaterThan(nowSeconds);
  });
});

// ---- RATE_LIMITS helper factories ----

describe('RATE_LIMITS', () => {
  it('tunnel() returns correct scope, limit 1000, window 3600', () => {
    const config = RATE_LIMITS.tunnel('myapp', 'workslocal.exposed');
    expect(config.scope).toBe('tunnel:workslocal.exposed:myapp');
    expect(config.limit).toBe(1000);
    expect(config.windowSeconds).toBe(3600);
  });

  it('anonymousIp() returns correct scope, limit 200, window 60', () => {
    const config = RATE_LIMITS.anonymousIp('192.168.1.1');
    expect(config.scope).toBe('ip:192.168.1.1');
    expect(config.limit).toBe(200);
    expect(config.windowSeconds).toBe(60);
  });

  it('user() returns correct scope, limit 5000, window 3600', () => {
    const config = RATE_LIMITS.user('user_abc123');
    expect(config.scope).toBe('user:user_abc123');
    expect(config.limit).toBe(5000);
    expect(config.windowSeconds).toBe(3600);
  });
});
