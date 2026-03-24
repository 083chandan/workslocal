import { describe, expect, it } from 'vitest';

import { AppError, ErrorCode, subdomainSchema, createTunnelSchema } from '../src/index.js';
import { createTunnelMessageSchema } from '../src/schemas/ws.js';

// ---- schema injection resistance ----

describe('schema injection resistance', () => {
  it('createTunnelMessageSchema rejects path traversal in custom_name', () => {
    const result = createTunnelMessageSchema.safeParse({
      type: 'create_tunnel',
      local_port: 3000,
      client_version: '0.1.0',
      custom_name: '../../etc',
    });
    expect(result.success).toBe(false);
  });

  it('createTunnelMessageSchema rejects XSS in custom_name', () => {
    const result = createTunnelMessageSchema.safeParse({
      type: 'create_tunnel',
      local_port: 3000,
      client_version: '0.1.0',
      custom_name: '<script>alert(1)</script>',
    });
    expect(result.success).toBe(false);
  });

  it('createTunnelMessageSchema rejects null bytes in custom_name', () => {
    const result = createTunnelMessageSchema.safeParse({
      type: 'create_tunnel',
      local_port: 3000,
      client_version: '0.1.0',
      custom_name: 'my\x00app',
    });
    expect(result.success).toBe(false);
  });
});

// ---- error response safety ----

describe('error response safety', () => {
  it('AppError.toJSON() never contains file paths for any error code', () => {
    for (const code of Object.values(ErrorCode)) {
      const err = new AppError(code);
      const json = JSON.stringify(err.toJSON());
      expect(json).not.toContain('/Users/');
      expect(json).not.toContain('node_modules');
    }
  });

  it('toJSON never contains stack trace indicator', () => {
    for (const code of Object.values(ErrorCode)) {
      const err = new AppError(code);
      const json = JSON.stringify(err.toJSON());
      expect(json).not.toMatch(/\bat\b.*\.(ts|js):\d+/);
    }
  });
});

// ---- input boundary testing ----

describe('input boundary testing', () => {
  it('subdomainSchema rejects string longer than 50 chars', () => {
    expect(subdomainSchema.safeParse('a'.repeat(51)).success).toBe(false);
  });

  it('createTunnelSchema rejects port outside 1-65535', () => {
    expect(createTunnelSchema.safeParse({ port: 0 }).success).toBe(false);
    expect(createTunnelSchema.safeParse({ port: 65536 }).success).toBe(false);
  });

  it('extremely long strings do not crash validators', () => {
    const longString = 'a'.repeat(10000);
    expect(() => subdomainSchema.safeParse(longString)).not.toThrow();
  });
});
