import { describe, expect, it } from 'vitest';

import { handleCors, withCors } from '../src/utils/cors.js';
import { base64ToUint8Array, uint8ArrayToBase64 } from '../src/utils/encoding.js';
import { parseTunnelHost } from '../src/utils/host.js';
import { generateId } from '../src/utils/id.js';
import { error, success } from '../src/utils/response.js';

// ---- parseTunnelHost -- extract subdomain from Host header ----

describe('parseTunnelHost', () => {
  const domains = ['workslocal.exposed', 'workslocal.io', 'workslocal.run'];

  it('extracts subdomain and domain from valid tunnel host', () => {
    expect(parseTunnelHost('myapp.workslocal.exposed', domains)).toEqual({
      subdomain: 'myapp',
      domain: 'workslocal.exposed',
    });
  });

  it('strips port number from host before parsing', () => {
    expect(parseTunnelHost('myapp.workslocal.io:443', domains)).toEqual({
      subdomain: 'myapp',
      domain: 'workslocal.io',
    });
  });

  it('returns null for bare tunnel domain (no subdomain)', () => {
    expect(parseTunnelHost('workslocal.exposed', domains)).toBeNull();
  });

  it('returns null for multi-level subdomain', () => {
    expect(parseTunnelHost('deep.sub.workslocal.exposed', domains)).toBeNull();
  });

  it('returns null for unknown domain', () => {
    expect(parseTunnelHost('myapp.example.com', domains)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseTunnelHost('', domains)).toBeNull();
  });

  it('lowercases hostname before matching', () => {
    expect(parseTunnelHost('MyApp.WorksLocal.Exposed', domains)).toEqual({
      subdomain: 'myapp',
      domain: 'workslocal.exposed',
    });
  });
});

// ---- generateId -- unique identifier generation ----

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns a 26-character string', () => {
    expect(generateId()).toHaveLength(26);
  });

  it('multiple calls produce unique values', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });

  it('contains only lowercase hex characters', () => {
    expect(generateId()).toMatch(/^[a-f0-9]+$/);
  });
});

// ---- uint8ArrayToBase64 / base64ToUint8Array -- binary encoding ----

describe('uint8ArrayToBase64 / base64ToUint8Array', () => {
  it('round-trip produces identical bytes', () => {
    const original = new Uint8Array([1, 2, 3, 4, 5, 255, 0, 128]);
    const decoded = base64ToUint8Array(uint8ArrayToBase64(original));
    expect(decoded).toEqual(original);
  });

  it('handles empty Uint8Array', () => {
    const empty = new Uint8Array(0);
    const decoded = base64ToUint8Array(uint8ArrayToBase64(empty));
    expect(decoded).toEqual(empty);
  });

  it('matches known values (Hello -> SGVsbG8=)', () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]);
    expect(uint8ArrayToBase64(bytes)).toBe('SGVsbG8=');
  });

  it('handles arrays larger than 32768 bytes', () => {
    const large = new Uint8Array(40000);
    for (let i = 0; i < large.length; i++) {
      large[i] = i % 256;
    }
    const decoded = base64ToUint8Array(uint8ArrayToBase64(large));
    expect(decoded).toEqual(large);
  });
});

// ---- handleCors / withCors -- CORS handling ----

describe('handleCors', () => {
  it('returns 204 with CORS headers for OPTIONS request', () => {
    const req = new Request('https://api.workslocal.dev/test', { method: 'OPTIONS' });
    const resp = handleCors(req);
    expect(resp).not.toBeNull();
    expect(resp!.status).toBe(204);
    expect(resp!.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(resp!.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('returns null for non-OPTIONS requests', () => {
    const req = new Request('https://api.workslocal.dev/test', { method: 'GET' });
    expect(handleCors(req)).toBeNull();
  });
});

describe('withCors', () => {
  it('adds CORS headers to a plain Response', () => {
    const corsed = withCors(new Response('ok', { status: 200 }));
    expect(corsed.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('preserves existing response headers', () => {
    const original = new Response('ok', {
      status: 200,
      headers: { 'X-Custom': 'value' },
    });
    const corsed = withCors(original);
    expect(corsed.headers.get('X-Custom')).toBe('value');
    expect(corsed.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

// ---- success / error -- JSON response factories ----

describe('success', () => {
  it('wraps data in {ok: true, data} with status 200', async () => {
    const resp = success({ foo: 'bar' });
    expect(resp.status).toBe(200);

    const body = await resp.json();
    expect(body).toEqual({ ok: true, data: { foo: 'bar' } });
  });

  it('accepts custom status code', () => {
    expect(success({}, 201).status).toBe(201);
  });
});

describe('error', () => {
  it('wraps in {ok: false, error: {code, message}} with status 400', async () => {
    const resp = error('TEST_CODE', 'test message');
    expect(resp.status).toBe(400);

    const body = await resp.json();
    expect(body).toEqual({ ok: false, error: { code: 'TEST_CODE', message: 'test message' } });
  });

  it('accepts custom status code', () => {
    expect(error('CODE', 'msg', 500).status).toBe(500);
  });
});
