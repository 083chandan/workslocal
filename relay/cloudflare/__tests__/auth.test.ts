import { describe, expect, it, vi } from 'vitest';

import { authenticateRequest } from '../src/auth.js';
import type { Env } from '../src/types.js';

// ─── Mock Env ────────────────────────────────────────────

function createMockEnv(
  overrides: Partial<{
    kvStore: Map<string, string>;
  }> = {},
): Env {
  const kvStore = overrides.kvStore ?? new Map<string, string>();

  return {
    TUNNEL: {} as Env['TUNNEL'],
    DB: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
          all: vi.fn().mockResolvedValue({ results: [] }),
          raw: vi.fn().mockResolvedValue([]),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    } as unknown as D1Database,
    KV: {
      get: vi.fn((key: string) => kvStore.get(key) ?? null),
      put: vi.fn((key: string, value: string) => {
        kvStore.set(key, value);
      }),
      delete: vi.fn((key: string) => {
        kvStore.delete(key);
      }),
      list: vi.fn(),
      getWithMetadata: vi.fn(),
    } as unknown as KVNamespace,
    TUNNEL_DOMAINS: 'workslocal.exposed',
    API_VERSION: 'v1',
    ENVIRONMENT: 'test',
    CLERK_PUBLISHABLE_KEY: 'pk_test_placeholder',
    CLERK_SECRET_KEY: 'sk_test_placeholder',
  };
}

function mockRequest(authHeader?: string): Request {
  const headers: Record<string, string> = {};
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }
  return new Request('https://api.workslocal.dev/test', { headers });
}

// ─── Tests ───────────────────────────────────────────────

describe('authenticateRequest', () => {
  describe('anonymous access (no auth header)', () => {
    it('allows anonymous requests', async () => {
      const env = createMockEnv();
      const result = await authenticateRequest(mockRequest(), env);

      expect(result.authenticated).toBe(true);
      expect(result.userId).toBeNull();
      expect(result.email).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('empty/invalid tokens', () => {
    it('rejects empty Bearer token', async () => {
      const env = createMockEnv();
      const result = await authenticateRequest(mockRequest('Bearer '), env);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Invalid token format');
    });

    it('rejects unrecognized token format', async () => {
      const env = createMockEnv();
      const result = await authenticateRequest(mockRequest('Bearer random-garbage-token'), env);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Invalid token format');
    });

    it('rejects token without Bearer prefix', async () => {
      const env = createMockEnv();
      const result = await authenticateRequest(mockRequest('wl_k_abc123'), env);

      // After stripping "Bearer ", the remaining string might not match patterns
      expect(result.authenticated).toBe(false);
    });
  });

  describe('API key authentication', () => {
    it('authenticates valid API key from KV cache', async () => {
      const kvStore = new Map<string, string>();

      // Pre-populate KV cache with a known hash
      // Hash of "wl_k_testapikey123456789012345678" — we'll compute it
      const testKey = 'wl_k_testapikey123456789012345678';
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(testKey));
      const keyHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      kvStore.set(
        `auth:${keyHash}`,
        JSON.stringify({ userId: 'user_123', email: 'test@example.com' }),
      );

      const env = createMockEnv({ kvStore });
      const result = await authenticateRequest(mockRequest(`Bearer ${testKey}`), env);

      expect(result.authenticated).toBe(true);
      expect(result.userId).toBe('user_123');
      expect(result.email).toBe('test@example.com');
      expect(result.error).toBeNull();
    });

    it('rejects invalid API key not in KV or D1', async () => {
      const env = createMockEnv();

      // Mock D1 to return no results (needs raw() for drizzle-orm compatibility)
      env.DB = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
            all: vi.fn().mockResolvedValue({ results: [] }),
            raw: vi.fn().mockResolvedValue([]),
            run: vi.fn().mockResolvedValue({ success: true }),
          }),
        }),
      } as unknown as D1Database;

      const result = await authenticateRequest(
        mockRequest('Bearer wl_k_invalidkey12345678901234567'),
        env,
      );

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });
  });

  describe('Clerk JWT authentication', () => {
    it('rejects expired JWT', async () => {
      // Create a minimal JWT with expired timestamp
      const header = btoa(JSON.stringify({ alg: 'RS256', kid: 'test-kid', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          sub: 'user_123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
          iss: 'https://clerk.workslocal.dev',
        }),
      );
      const fakeSignature = btoa('fake-signature');
      const jwt = `${header}.${payload}.${fakeSignature}`;

      const env = createMockEnv();
      const result = await authenticateRequest(mockRequest(`Bearer ${jwt}`), env);

      // Should fail — either because JWKS fetch fails or signature is invalid
      expect(result.authenticated).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects malformed JWT (missing parts)', async () => {
      const env = createMockEnv();
      const result = await authenticateRequest(mockRequest('Bearer eyJhbGciOiJSUzI1NiJ9'), env);

      expect(result.authenticated).toBe(false);
    });

    it('rejects JWT with invalid base64', async () => {
      const env = createMockEnv();
      const result = await authenticateRequest(mockRequest('Bearer eyJ!!!.eyJ!!!.!!!'), env);

      expect(result.authenticated).toBe(false);
    });
  });

  describe('token type detection', () => {
    it('detects API key by wl_k_ prefix', async () => {
      const env = createMockEnv();

      // Will fail auth but should go through API key path (not JWT)
      const result = await authenticateRequest(mockRequest('Bearer wl_k_anything'), env);

      // The error should NOT mention JWT
      expect(result.error).not.toContain('JWT');
    });

    it('detects JWT by eyJ prefix', async () => {
      const env = createMockEnv();

      const result = await authenticateRequest(
        mockRequest('Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.fake'),
        env,
      );

      // Should go through JWT path — will fail on JWKS/signature but not on "Invalid API key"
      expect(result.error).not.toBe('Invalid API key');
    });
  });
});

describe('API key hashing', () => {
  it('produces consistent SHA-256 hash', async () => {
    const key = 'wl_k_testapikey123456789012345678';
    const encoder = new TextEncoder();

    const hash1 = await crypto.subtle.digest('SHA-256', encoder.encode(key));
    const hash2 = await crypto.subtle.digest('SHA-256', encoder.encode(key));

    const hex1 = Array.from(new Uint8Array(hash1))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const hex2 = Array.from(new Uint8Array(hash2))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    expect(hex1).toBe(hex2);
    expect(hex1).toHaveLength(64); // SHA-256 = 32 bytes = 64 hex chars
  });

  it('produces different hashes for different keys', async () => {
    const encoder = new TextEncoder();

    const hash1 = await crypto.subtle.digest('SHA-256', encoder.encode('wl_k_key1'));
    const hash2 = await crypto.subtle.digest('SHA-256', encoder.encode('wl_k_key2'));

    const hex1 = Array.from(new Uint8Array(hash1))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const hex2 = Array.from(new Uint8Array(hash2))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    expect(hex1).not.toBe(hex2);
  });
});
