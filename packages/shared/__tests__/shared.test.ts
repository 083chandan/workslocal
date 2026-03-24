import { describe, expect, it } from 'vitest';

import {
  ANONYMOUS_TUNNEL_TTL_MS,
  API_KEY_PREFIX,
  apiKeySchema,
  AppError,
  createTunnelSchema,
  DEFAULT_TUNNEL_DOMAIN,
  ErrorCode,
  formatPublicUrl,
  generateRandomSubdomain,
  HEARTBEAT_INTERVAL_MS,
  isValidTunnelDomain,
  MAX_PAYLOAD_BYTES,
  parseHostHeader,
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_REGEX,
  SUBDOMAIN_RESERVATION_MS,
  subdomainSchema,
  TUNNEL_DOMAINS,
  validateSubdomain,
} from '../src/index.js';
import { clientMessageSchema, createTunnelMessageSchema } from '../src/schemas/ws.js';

describe('@workslocal/shared', () => {
  describe('constants', () => {
    it('should have 3 tunnel domains', () => {
      expect(TUNNEL_DOMAINS).toHaveLength(3);
    });

    it('should default to workslocal.exposed', () => {
      expect(DEFAULT_TUNNEL_DOMAIN).toBe('workslocal.exposed');
    });

    it('should include standard reserved subdomains', () => {
      expect(RESERVED_SUBDOMAINS).toContain('www');
      expect(RESERVED_SUBDOMAINS).toContain('api');
      expect(RESERVED_SUBDOMAINS).toContain('admin');
    });
  });

  describe('validateSubdomain', () => {
    it('accepts valid subdomains', () => {
      expect(validateSubdomain('myapp')).toBeNull();
      expect(validateSubdomain('my-app')).toBeNull();
      expect(validateSubdomain('a')).toBeNull();
      expect(validateSubdomain('test123')).toBeNull();
      expect(validateSubdomain('a'.repeat(50))).toBeNull();
    });

    it('rejects empty subdomains', () => {
      expect(validateSubdomain('')).not.toBeNull();
    });

    it('rejects invalid characters', () => {
      expect(validateSubdomain('My_App')).not.toBeNull();
      expect(validateSubdomain('my app')).not.toBeNull();
      expect(validateSubdomain('my.app')).not.toBeNull();
      expect(validateSubdomain('UPPER')).not.toBeNull();
    });

    it('rejects leading/trailing hyphens', () => {
      expect(validateSubdomain('-myapp')).not.toBeNull();
      expect(validateSubdomain('myapp-')).not.toBeNull();
    });

    it('rejects reserved subdomains', () => {
      expect(validateSubdomain('www')).not.toBeNull();
      expect(validateSubdomain('api')).not.toBeNull();
      expect(validateSubdomain('admin')).not.toBeNull();
    });

    it('rejects subdomains over 50 characters', () => {
      expect(validateSubdomain('a'.repeat(51))).not.toBeNull();
    });
  });

  describe('generateRandomSubdomain', () => {
    it('generates correct length', () => {
      expect(generateRandomSubdomain(8)).toHaveLength(8);
      expect(generateRandomSubdomain(12)).toHaveLength(12);
      expect(generateRandomSubdomain()).toHaveLength(8);
    });

    it('produces lowercase alphanumeric only', () => {
      const sub = generateRandomSubdomain(100);
      expect(sub).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('formatPublicUrl', () => {
    it('formats valid HTTPS URLs', () => {
      expect(formatPublicUrl('myapp', 'workslocal.run')).toBe('https://myapp.workslocal.run');
      expect(formatPublicUrl('demo', 'workslocal.exposed')).toBe('https://demo.workslocal.exposed');
      expect(formatPublicUrl('demo', 'workslocal.io')).toBe('https://demo.workslocal.io');
    });
  });

  describe('parseHostHeader', () => {
    it('extracts subdomain and domain', () => {
      expect(parseHostHeader('myapp.workslocal.exposed')).toEqual({
        subdomain: 'myapp',
        domain: 'workslocal.exposed',
      });
    });

    it('handles port in host', () => {
      expect(parseHostHeader('myapp.workslocal.io:443')).toEqual({
        subdomain: 'myapp',
        domain: 'workslocal.io',
      });
    });

    it('returns null for unknown domains', () => {
      expect(parseHostHeader('myapp.example.com')).toBeNull();
    });

    it('returns null for bare tunnel domains', () => {
      expect(parseHostHeader('workslocal.exposed')).toBeNull();
    });
  });

  describe('isValidTunnelDomain', () => {
    it('accepts valid tunnel domains', () => {
      expect(isValidTunnelDomain('workslocal.exposed')).toBe(true);
      expect(isValidTunnelDomain('workslocal.io')).toBe(true);
      expect(isValidTunnelDomain('workslocal.run')).toBe(true);
    });

    it('rejects invalid domains', () => {
      expect(isValidTunnelDomain('example.com')).toBe(false);
      expect(isValidTunnelDomain('workslocal.dev')).toBe(false);
    });
  });

  describe('Zod schemas', () => {
    describe('createTunnelSchema', () => {
      it('accepts valid data', () => {
        expect(createTunnelSchema.safeParse({ port: 3000 }).success).toBe(true);
        expect(
          createTunnelSchema.safeParse({
            port: 8080,
            subdomain: 'myapp',
            domain: 'workslocal.run',
          }).success,
        ).toBe(true);
      });

      it('rejects invalid ports', () => {
        expect(createTunnelSchema.safeParse({ port: 0 }).success).toBe(false);
        expect(createTunnelSchema.safeParse({ port: 70000 }).success).toBe(false);
      });

      it('rejects invalid domains', () => {
        expect(createTunnelSchema.safeParse({ port: 3000, domain: 'example.com' }).success).toBe(
          false,
        );
      });
    });

    describe('subdomainSchema', () => {
      it('accepts valid subdomains', () => {
        expect(subdomainSchema.safeParse('myapp').success).toBe(true);
      });

      it('rejects invalid subdomains', () => {
        expect(subdomainSchema.safeParse('').success).toBe(false);
        expect(subdomainSchema.safeParse('-invalid').success).toBe(false);
      });
    });

    describe('apiKeySchema', () => {
      it('accepts valid names', () => {
        expect(apiKeySchema.safeParse({ name: 'My Key' }).success).toBe(true);
      });

      it('rejects empty names', () => {
        expect(apiKeySchema.safeParse({ name: '' }).success).toBe(false);
      });
    });
  });

  describe('AppError', () => {
    it('creates structured errors with correct HTTP status', () => {
      const err = new AppError('SUBDOMAIN_TAKEN');
      expect(err.code).toBe('SUBDOMAIN_TAKEN');
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe('Subdomain is already in use');
    });

    it('supports custom messages', () => {
      const err = new AppError('VALIDATION_ERROR', 'Port must be between 1 and 65535');
      expect(err.message).toBe('Port must be between 1 and 65535');
      expect(err.statusCode).toBe(400);
    });

    it('serializes to JSON correctly', () => {
      const err = new AppError('RATE_LIMITED');
      expect(err.toJSON()).toEqual({
        ok: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      });
    });

    it('is detectable via isAppError', () => {
      expect(AppError.isAppError(new AppError('AUTH_FAILED'))).toBe(true);
      expect(AppError.isAppError(new Error('generic'))).toBe(false);
      expect(AppError.isAppError('string')).toBe(false);
    });
  });

  describe('ErrorCode', () => {
    it('has expected codes', () => {
      expect(ErrorCode.AUTH_FAILED).toBe('AUTH_FAILED');
      expect(ErrorCode.SUBDOMAIN_TAKEN).toBe('SUBDOMAIN_TAKEN');
      expect(ErrorCode.RATE_LIMITED).toBe('RATE_LIMITED');
      expect(ErrorCode.NOT_IMPLEMENTED).toBe('NOT_IMPLEMENTED');
    });
  });

  // ---- validateSubdomain -- edge cases (security, boundaries) ----

  describe('validateSubdomain -- edge cases', () => {
    it('rejects path traversal attempts', () => {
      expect(validateSubdomain('../../etc')).not.toBeNull();
      expect(validateSubdomain('../passwd')).not.toBeNull();
    });

    it('rejects XSS strings', () => {
      expect(validateSubdomain('<script>')).not.toBeNull();
      expect(validateSubdomain('alert(1)')).not.toBeNull();
    });

    it('rejects SQL injection patterns', () => {
      expect(validateSubdomain("'; DROP TABLE--")).not.toBeNull();
      expect(validateSubdomain('1 OR 1=1')).not.toBeNull();
    });

    it('rejects null bytes', () => {
      expect(validateSubdomain('my\x00app')).not.toBeNull();
    });

    it('rejects unicode characters', () => {
      expect(validateSubdomain('caf\u00e9')).not.toBeNull();
      expect(validateSubdomain('\u0430pp')).not.toBeNull();
    });

    it('rejects whitespace variants', () => {
      expect(validateSubdomain('my\tapp')).not.toBeNull();
      expect(validateSubdomain('my\napp')).not.toBeNull();
      expect(validateSubdomain('my\rapp')).not.toBeNull();
    });

    it('rejects all RESERVED_SUBDOMAINS exhaustively', () => {
      for (const reserved of RESERVED_SUBDOMAINS) {
        expect(validateSubdomain(reserved)).not.toBeNull();
      }
    });

    it('accepts double hyphens in middle', () => {
      expect(validateSubdomain('my--app')).toBeNull();
    });

    it('accepts hyphens between alphanumeric', () => {
      expect(validateSubdomain('a-b-c-d-e')).toBeNull();
    });

    it('rejects hyphens-only', () => {
      expect(validateSubdomain('---')).not.toBeNull();
    });

    it('accepts numeric-only subdomain', () => {
      expect(validateSubdomain('12345')).toBeNull();
    });
  });

  // ---- generateRandomSubdomain -- robustness ----

  describe('generateRandomSubdomain -- robustness', () => {
    it('never generates a reserved subdomain (1000 iterations)', () => {
      for (let i = 0; i < 1000; i++) {
        const sub = generateRandomSubdomain();
        expect(RESERVED_SUBDOMAINS).not.toContain(sub);
      }
    });

    it('always generates a valid subdomain (1000 iterations)', () => {
      for (let i = 0; i < 1000; i++) {
        const sub = generateRandomSubdomain();
        expect(validateSubdomain(sub)).toBeNull();
      }
    });

    it('generates unique values with high probability', () => {
      const subs = new Set(Array.from({ length: 100 }, () => generateRandomSubdomain()));
      expect(subs.size).toBeGreaterThan(95);
    });
  });

  // ---- parseHostHeader -- edge cases ----

  describe('parseHostHeader -- edge cases', () => {
    it('returns null for empty string', () => {
      expect(parseHostHeader('')).toBeNull();
    });

    it('returns null for IP addresses', () => {
      expect(parseHostHeader('192.168.1.1')).toBeNull();
      expect(parseHostHeader('192.168.1.1:3000')).toBeNull();
    });

    it('returns null for localhost', () => {
      expect(parseHostHeader('localhost')).toBeNull();
      expect(parseHostHeader('localhost:3000')).toBeNull();
    });

    it('returns null for multi-level subdomain', () => {
      const result = parseHostHeader('my.app.workslocal.exposed');
      expect(result).toBeNull();
    });

    it('returns null for very long host header', () => {
      const longHost = 'a'.repeat(200) + '.workslocal.exposed';
      const result = parseHostHeader(longHost);
      if (result) {
        expect(validateSubdomain(result.subdomain)).not.toBeNull();
      }
    });
  });

  // ---- createTunnelSchema -- edge cases ----

  describe('createTunnelSchema -- edge cases', () => {
    it('rejects string port', () => {
      expect(createTunnelSchema.safeParse({ port: '3000' }).success).toBe(false);
    });

    it('rejects negative port', () => {
      expect(createTunnelSchema.safeParse({ port: -1 }).success).toBe(false);
    });

    it('accepts boundary port 1', () => {
      expect(createTunnelSchema.safeParse({ port: 1 }).success).toBe(true);
    });

    it('accepts boundary port 65535', () => {
      expect(createTunnelSchema.safeParse({ port: 65535 }).success).toBe(true);
    });

    it('rejects port 65536', () => {
      expect(createTunnelSchema.safeParse({ port: 65536 }).success).toBe(false);
    });

    it('rejects float port', () => {
      expect(createTunnelSchema.safeParse({ port: 3000.5 }).success).toBe(false);
    });

    it('accepts missing optional fields', () => {
      expect(createTunnelSchema.safeParse({ port: 3000 }).success).toBe(true);
    });
  });

  // ---- WS schemas ----

  describe('WS schemas', () => {
    it('createTunnelMessageSchema accepts valid create_tunnel message', () => {
      const result = createTunnelMessageSchema.safeParse({
        type: 'create_tunnel',
        local_port: 3000,
        client_version: '0.1.0',
      });
      expect(result.success).toBe(true);
    });

    it('createTunnelMessageSchema rejects missing client_version', () => {
      const result = createTunnelMessageSchema.safeParse({
        type: 'create_tunnel',
        local_port: 3000,
      });
      expect(result.success).toBe(false);
    });

    it('clientMessageSchema resolves each message type', () => {
      expect(
        clientMessageSchema.safeParse({
          type: 'create_tunnel',
          local_port: 3000,
          client_version: '0.1.0',
        }).success,
      ).toBe(true);

      expect(
        clientMessageSchema.safeParse({
          type: 'close_tunnel',
          tunnel_id: 'tun-123',
        }).success,
      ).toBe(true);

      expect(
        clientMessageSchema.safeParse({
          type: 'http_response',
          request_id: 'req-1',
          status_code: 200,
          headers: {},
          body: '',
        }).success,
      ).toBe(true);

      expect(
        clientMessageSchema.safeParse({
          type: 'ping',
          timestamp: Date.now(),
        }).success,
      ).toBe(true);
    });

    it('clientMessageSchema rejects unknown type', () => {
      expect(
        clientMessageSchema.safeParse({
          type: 'unknown_type',
        }).success,
      ).toBe(false);
    });
  });

  // ---- AppError -- all error codes ----

  describe('AppError -- all error codes', () => {
    it('every ErrorCode produces a message and statusCode in 400-599', () => {
      for (const code of Object.values(ErrorCode)) {
        const err = new AppError(code);
        expect(err.message).toBeTruthy();
        expect(err.statusCode).toBeGreaterThanOrEqual(400);
        expect(err.statusCode).toBeLessThan(600);
      }
    });

    it('toJSON never includes stack trace', () => {
      const err = new AppError('AUTH_FAILED');
      const json = err.toJSON();
      expect(json).not.toHaveProperty('stack');
      expect(JSON.stringify(json)).not.toContain('at ');
    });

    it('preserves details parameter', () => {
      const details = { field: 'port', reason: 'out of range' };
      const err = new AppError('VALIDATION_ERROR', 'Bad input', details);
      expect(err.details).toEqual(details);
    });

    it('isAppError returns false for plain Error, string, null', () => {
      expect(AppError.isAppError(new Error('generic'))).toBe(false);
      expect(AppError.isAppError('string')).toBe(false);
      expect(AppError.isAppError(null)).toBe(false);
    });
  });

  // ---- constants -- integrity checks ----

  describe('constants -- integrity checks', () => {
    it('API_KEY_PREFIX equals wl_k_', () => {
      expect(API_KEY_PREFIX).toBe('wl_k_');
    });

    it('MAX_PAYLOAD_BYTES equals 10MB', () => {
      expect(MAX_PAYLOAD_BYTES).toBe(10 * 1024 * 1024);
    });

    it('HEARTBEAT_INTERVAL_MS equals 30 seconds', () => {
      expect(HEARTBEAT_INTERVAL_MS).toBe(30_000);
    });

    it('SUBDOMAIN_RESERVATION_MS equals 30 minutes', () => {
      expect(SUBDOMAIN_RESERVATION_MS).toBe(1_800_000);
    });

    it('SUBDOMAIN_REGEX matches valid names', () => {
      expect(SUBDOMAIN_REGEX.test('validname')).toBe(true);
      expect(SUBDOMAIN_REGEX.test('my-app')).toBe(true);
    });

    it('SUBDOMAIN_REGEX rejects uppercase and leading hyphens', () => {
      expect(SUBDOMAIN_REGEX.test('UPPERCASE')).toBe(false);
      expect(SUBDOMAIN_REGEX.test('-leading')).toBe(false);
    });

    it('ANONYMOUS_TUNNEL_TTL_MS equals 2 hours', () => {
      expect(ANONYMOUS_TUNNEL_TTL_MS).toBe(7_200_000);
    });
  });
});
