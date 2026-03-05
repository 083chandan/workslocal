import { describe, it, expect } from 'vitest';

import {
  validateSubdomain,
  generateRandomSubdomain,
  formatPublicUrl,
  parseHostHeader,
  isValidTunnelDomain,
  createTunnelSchema,
  subdomainSchema,
  apiKeySchema,
  ErrorCode,
  AppError,
  TUNNEL_DOMAINS,
  DEFAULT_TUNNEL_DOMAIN,
  RESERVED_SUBDOMAINS,
} from '../src/index.js';

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
});
