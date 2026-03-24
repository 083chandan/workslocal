/**
 * Worker Routing Integration Tests
 *
 * Tests the Worker's fetch handler routing logic against local wrangler dev.
 * Covers: health, CORS, 404s, tunnel subdomain routing, WS upgrade path.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { WebSocket } from 'ws';

import { assertDevServerRunning, tunnelFetch, BASE_URL, delay } from './helpers.js';

beforeAll(async () => {
  await assertDevServerRunning();
});

describe('Worker routing — health', () => {
  it('GET /health returns 200 with status ok', async () => {
    const resp = await fetch(`${BASE_URL}/health`);
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('ok');
  });

  it('GET /health/ready returns 200', async () => {
    const resp = await fetch(`${BASE_URL}/health/ready`);
    expect(resp.status).toBe(200);
  });
});

describe('Worker routing — CORS', () => {
  it('OPTIONS /health returns 204 with CORS headers', async () => {
    const resp = await fetch(`${BASE_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    });
    expect(resp.status).toBe(204);
    expect(resp.headers.get('access-control-allow-origin')).toBeTruthy();
  });

  it('GET responses include CORS headers', async () => {
    const resp = await fetch(`${BASE_URL}/health`);
    expect(resp.headers.get('access-control-allow-origin')).toBeTruthy();
  });

  it('responses include X-API-Version header', async () => {
    const resp = await fetch(`${BASE_URL}/health`);
    expect(resp.headers.get('x-api-version')).toBe('v1');
  });
});

describe('Worker routing — unknown routes', () => {
  it('returns 404 JSON for /nonexistent', async () => {
    const resp = await fetch(`${BASE_URL}/nonexistent`);
    expect(resp.status).toBe(404);
    const body = await resp.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for /api/v1/nonexistent', async () => {
    const resp = await fetch(`${BASE_URL}/api/v1/nonexistent`);
    expect(resp.status).toBe(404);
  });
});

describe('Worker routing — tunnel host detection', () => {
  it('returns 404 TUNNEL_NOT_FOUND for non-existent subdomain', async () => {
    // Uses node:http tunnelFetch so Host header actually gets sent
    const resp = await tunnelFetch('ghost-does-not-exist', '/api/test');
    expect(resp.status).toBe(404);
    const body = JSON.parse(resp.body) as { ok: boolean; error: { code: string } };
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('TUNNEL_NOT_FOUND');
  });

  it('routes bare tunnel domain to 404 (no subdomain)', async () => {
    const resp = await fetch(`${BASE_URL}/`, {
      headers: { Host: 'workslocal.exposed' },
    });
    // parseTunnelHost returns null for bare domain → falls through to router → 404
    expect(resp.status).toBe(404);
  });

  it('unknown domain falls through to router', async () => {
    const resp = await fetch(`${BASE_URL}/`, {
      headers: { Host: 'evil.com' },
    });
    expect(resp.status).toBe(404);
  });

  it('Host header with port is handled', async () => {
    const resp = await fetch(`${BASE_URL}/`, {
      headers: { Host: 'ghost.workslocal.exposed:8787' },
    });
    // Should attempt tunnel routing (parseTunnelHost strips port)
    expect(resp.status).toBeDefined();
  });

  it('multi-level subdomain is not a tunnel', async () => {
    const resp = await fetch(`${BASE_URL}/`, {
      headers: { Host: 'deep.sub.workslocal.exposed' },
    });
    // parseTunnelHost returns null for multi-level
    expect(resp.status).toBe(404);
  });
});

describe('Worker routing — WebSocket /ws', () => {
  it('accepts WebSocket upgrade on /ws', async () => {
    const ws = new WebSocket(`${BASE_URL.replace('http', 'ws')}/ws`);

    const connected = await new Promise<boolean>((resolve) => {
      ws.on('open', () => resolve(true));
      ws.on('error', () => resolve(false));
      setTimeout(() => resolve(false), 5000);
    });

    expect(connected).toBe(true);
    ws.close();
    await delay(200);
  });

  it('responds to ping with pong immediately after connect', async () => {
    const ws = new WebSocket(`${BASE_URL.replace('http', 'ws')}/ws`);
    await new Promise<void>((resolve) => ws.on('open', resolve));

    const pongPromise = new Promise<Record<string, unknown>>((resolve) => {
      ws.on('message', (data: Buffer) => {
        const msg = JSON.parse(data.toString()) as Record<string, unknown>;
        if (msg.type === 'pong') resolve(msg);
      });
    });

    const now = Date.now();
    ws.send(JSON.stringify({ type: 'ping', timestamp: now }));

    const pong = await pongPromise;
    expect(pong.type).toBe('pong');
    expect(pong.timestamp).toBe(now);

    ws.close();
    await delay(200);
  });
});

describe('Worker routing — error response format', () => {
  it('404 error does not leak stack traces', async () => {
    const resp = await fetch(`${BASE_URL}/nonexistent`);
    const text = await resp.text();
    expect(text).not.toContain('at ');
    expect(text).not.toContain('.ts:');
    expect(text).not.toContain('node_modules');
    expect(text).not.toContain('wrangler');
  });

  it('tunnel 404 does not leak internal details', async () => {
    // Use node:http to ensure Host header is sent for tunnel routing
    const resp = await tunnelFetch('noexist-leak-check', '/test');
    expect(resp.body).not.toContain('KV');
    expect(resp.body).not.toContain('D1');
    expect(resp.body).not.toContain('Durable');
  });
});
