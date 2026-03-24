/**
 * HTTP Forwarding Integration Tests
 *
 * Tests the full HTTP round-trip: caller → Worker → DO → WS → client → response.
 * The test acts as both the HTTP caller and the tunnel client (via WS autoRespond).
 * Runs against local wrangler dev on localhost:8787.
 */
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { WebSocket } from 'ws';

import {
  assertDevServerRunning,
  createTunnel,
  autoRespond,
  tunnelFetch,
  closeWS,
  uniqueSubdomain,
  delay,
} from './helpers.js';

const openSockets: WebSocket[] = [];

beforeAll(async () => {
  await assertDevServerRunning();
});

afterEach(async () => {
  for (const ws of openSockets) {
    await closeWS(ws);
  }
  openSockets.length = 0;
});

function track(ws: WebSocket): WebSocket {
  openSockets.push(ws);
  return ws;
}

// ─── Basic HTTP Forwarding ───────────────────────────────────

describe('HTTP forwarding — basic', () => {
  it('GET returns 200 with response body', async () => {
    const name = uniqueSubdomain('get');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);
    autoRespond(tunnel.ws, 200, '{"hello":"world"}');

    const resp = await tunnelFetch(name, '/api/test');
    expect(resp.status).toBe(200);

    const body = JSON.parse(resp.body) as Record<string, unknown>;
    expect(body.hello).toBe('world');
  });

  it('POST forwards request body to client', async () => {
    const name = uniqueSubdomain('post');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    // Echo back the decoded request body
    tunnel.ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString()) as Record<string, unknown>;
      if (msg.type === 'http_request') {
        const decoded = msg.body ? Buffer.from(msg.body as string, 'base64').toString() : '';
        tunnel.ws.send(
          JSON.stringify({
            type: 'http_response',
            request_id: msg.request_id,
            status_code: 200,
            headers: { 'content-type': 'application/json' },
            body: Buffer.from(JSON.stringify({ echoed: decoded })).toString('base64'),
          }),
        );
      }
    });

    const resp = await tunnelFetch(name, '/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'chandan', role: 'developer' }),
    });

    expect(resp.status).toBe(200);
    const body = JSON.parse(resp.body) as { echoed: string };
    const parsed = JSON.parse(body.echoed) as Record<string, string>;
    expect(parsed.name).toBe('chandan');
    expect(parsed.role).toBe('developer');
  });
});

// ─── All HTTP Methods ────────────────────────────────────────

describe('HTTP forwarding — all methods', () => {
  it('forwards GET, POST, PUT, PATCH, DELETE, OPTIONS', async () => {
    const name = uniqueSubdomain('methods');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    // Echo back the method
    tunnel.ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString()) as Record<string, unknown>;
      if (msg.type === 'http_request') {
        tunnel.ws.send(
          JSON.stringify({
            type: 'http_response',
            request_id: msg.request_id,
            status_code: 200,
            headers: { 'content-type': 'application/json' },
            body: Buffer.from(JSON.stringify({ method: msg.method })).toString('base64'),
          }),
        );
      }
    });

    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      const resp = await tunnelFetch(name, `/api/${method.toLowerCase()}`, { method });
      // OPTIONS may be intercepted by CORS handler — skip if 204
      if (resp.status === 204) continue;

      expect(resp.status).toBe(200);
      const body = JSON.parse(resp.body) as { method: string };
      expect(body.method).toBe(method);
    }
  });
});

// ─── Header Forwarding ──────────────────────────────────────

describe('HTTP forwarding — headers', () => {
  it('forwards custom request headers to client', async () => {
    const name = uniqueSubdomain('req-headers');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    tunnel.ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString()) as Record<string, unknown>;
      if (msg.type === 'http_request') {
        const headers = msg.headers as Record<string, string>;
        tunnel.ws.send(
          JSON.stringify({
            type: 'http_response',
            request_id: msg.request_id,
            status_code: 200,
            headers: { 'content-type': 'application/json' },
            body: Buffer.from(
              JSON.stringify({ received: headers['x-custom-test'] ?? 'missing' }),
            ).toString('base64'),
          }),
        );
      }
    });

    const resp = await tunnelFetch(name, '/api/test', {
      headers: { 'X-Custom-Test': 'hello-from-test' },
    });
    const body = JSON.parse(resp.body) as { received: string };
    expect(body.received).toBe('hello-from-test');
  });

  it('returns custom response headers from client', async () => {
    const name = uniqueSubdomain('resp-headers');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    tunnel.ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString()) as Record<string, unknown>;
      if (msg.type === 'http_request') {
        tunnel.ws.send(
          JSON.stringify({
            type: 'http_response',
            request_id: msg.request_id,
            status_code: 200,
            headers: {
              'content-type': 'application/json',
              'x-custom-response': 'from-tunnel',
              'x-request-id': 'test-123',
            },
            body: Buffer.from('{}').toString('base64'),
          }),
        );
      }
    });

    const resp = await tunnelFetch(name, '/api/test');
    expect(resp.headers['x-custom-response']).toBe('from-tunnel');
    expect(resp.headers['x-request-id']).toBe('test-123');
  });

  it('strips internal headers (cf-, x-tunnel-) before forwarding', async () => {
    const name = uniqueSubdomain('strip-headers');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    tunnel.ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString()) as Record<string, unknown>;
      if (msg.type === 'http_request') {
        const headers = msg.headers as Record<string, string>;
        tunnel.ws.send(
          JSON.stringify({
            type: 'http_response',
            request_id: msg.request_id,
            status_code: 200,
            headers: { 'content-type': 'application/json' },
            body: Buffer.from(JSON.stringify({ headerKeys: Object.keys(headers) })).toString(
              'base64',
            ),
          }),
        );
      }
    });

    const resp = await tunnelFetch(name, '/api/test');
    const body = JSON.parse(resp.body) as { headerKeys: string[] };
    // Internal headers should be stripped
    expect(body.headerKeys).not.toContain('x-tunnel-subdomain');
    expect(body.headerKeys).not.toContain('x-tunnel-domain');
    expect(body.headerKeys).not.toContain('x-tunnel-request-type');
  });
});

// ─── Status Code Passthrough ────────────────────────────────

describe('HTTP forwarding — status codes', () => {
  it('passes through non-200 status codes', async () => {
    const name = uniqueSubdomain('status');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    let callCount = 0;
    const statuses = [201, 301, 400, 401, 403, 404, 500, 503];

    tunnel.ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString()) as Record<string, unknown>;
      if (msg.type === 'http_request') {
        const status = statuses[callCount % statuses.length]!;
        callCount++;
        tunnel.ws.send(
          JSON.stringify({
            type: 'http_response',
            request_id: msg.request_id,
            status_code: status,
            headers: { 'content-type': 'application/json' },
            body: Buffer.from(`{"status":${String(status)}}`).toString('base64'),
          }),
        );
      }
    });

    for (const expectedStatus of statuses) {
      const resp = await tunnelFetch(name, `/api/status-${String(expectedStatus)}`);
      expect(resp.status).toBe(expectedStatus);
    }
  });
});

// ─── Query String ───────────────────────────────────────────

describe('HTTP forwarding — query string', () => {
  it('forwards query parameters to client', async () => {
    const name = uniqueSubdomain('query');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    tunnel.ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString()) as Record<string, unknown>;
      if (msg.type === 'http_request') {
        tunnel.ws.send(
          JSON.stringify({
            type: 'http_response',
            request_id: msg.request_id,
            status_code: 200,
            headers: { 'content-type': 'application/json' },
            body: Buffer.from(JSON.stringify({ path: msg.path, query: msg.query })).toString(
              'base64',
            ),
          }),
        );
      }
    });

    const resp = await tunnelFetch(name, '/api/search?q=test&page=2&sort=desc');
    const body = JSON.parse(resp.body) as { path: string; query: Record<string, string> };
    expect(body.path).toBe('/api/search');
    expect(body.query.q).toBe('test');
    expect(body.query.page).toBe('2');
    expect(body.query.sort).toBe('desc');
  });
});

// ─── Timeout & Error Cases ──────────────────────────────────

describe('HTTP forwarding — error handling', () => {
  it('returns 502 when tunnel client WS is not connected', async () => {
    const name = uniqueSubdomain('no-ws');
    const tunnel = await createTunnel({ name });

    // Disconnect the client WS
    await closeWS(tunnel.ws);
    await delay(1000);

    const resp = await tunnelFetch(name, '/api/test');
    expect(resp.status).toBeGreaterThanOrEqual(400);
  });

  it('returns 504 when client never responds to http_request', async () => {
    const name = uniqueSubdomain('timeout');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    // Don't set up autoRespond — let it timeout (30s)
    const resp = await tunnelFetch(name, '/api/test');
    expect(resp.status).toBe(504);
    const body = JSON.parse(resp.body) as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe('GATEWAY_TIMEOUT');
  }, 35_000);

  it('returns 413 for body over 10MB', async () => {
    const name = uniqueSubdomain('bigbody');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);
    autoRespond(tunnel.ws);

    const largeBody = 'x'.repeat(11 * 1024 * 1024);
    const resp = await tunnelFetch(name, '/api/upload', {
      method: 'POST',
      body: largeBody,
    });
    expect(resp.status).toBe(413);
  });
});

// ─── Concurrent Requests ────────────────────────────────────

describe('HTTP forwarding — concurrency', () => {
  it('handles 5 concurrent requests to same tunnel', async () => {
    const name = uniqueSubdomain('concurrent');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    // Respond with the request path so we can verify each gets its own response
    tunnel.ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString()) as Record<string, unknown>;
      if (msg.type === 'http_request') {
        setTimeout(() => {
          tunnel.ws.send(
            JSON.stringify({
              type: 'http_response',
              request_id: msg.request_id,
              status_code: 200,
              headers: { 'content-type': 'application/json' },
              body: Buffer.from(JSON.stringify({ path: msg.path })).toString('base64'),
            }),
          );
        }, Math.random() * 100);
      }
    });

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        tunnelFetch(name, `/api/item/${String(i)}`).then((r) => ({
          status: r.status,
          body: JSON.parse(r.body) as { path: string },
        })),
      ),
    );

    // All should succeed
    expect(results.every((r) => r.status === 200)).toBe(true);
    // Each should have its own path
    const paths = results.map((r) => r.body.path);
    expect(new Set(paths).size).toBe(5);
  });
});

// ─── Multi-Tunnel Isolation ─────────────────────────────────

describe('HTTP forwarding — multi-tunnel isolation', () => {
  it('requests route to correct tunnel', async () => {
    const name1 = uniqueSubdomain('iso-alpha');
    const name2 = uniqueSubdomain('iso-beta');

    const tunnel1 = await createTunnel({ name: name1 });
    const tunnel2 = await createTunnel({ name: name2 });
    track(tunnel1.ws);
    track(tunnel2.ws);

    autoRespond(tunnel1.ws, 200, '"alpha"');
    autoRespond(tunnel2.ws, 200, '"beta"');

    const [resp1, resp2] = await Promise.all([tunnelFetch(name1, '/'), tunnelFetch(name2, '/')]);

    expect(resp1.status).toBe(200);
    expect(resp2.status).toBe(200);
    expect(resp1.body).toContain('alpha');
    expect(resp2.body).toContain('beta');
    // No cross-contamination
    expect(resp1.body).not.toContain('beta');
    expect(resp2.body).not.toContain('alpha');
  });
});

// ─── Empty Body Edge Cases ──────────────────────────────────

describe('HTTP forwarding — empty bodies', () => {
  it('GET with no body works', async () => {
    const name = uniqueSubdomain('empty-get');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    tunnel.ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString()) as Record<string, unknown>;
      if (msg.type === 'http_request') {
        const bodyStr = (msg.body as string) ?? '';
        tunnel.ws.send(
          JSON.stringify({
            type: 'http_response',
            request_id: msg.request_id,
            status_code: 200,
            headers: { 'content-type': 'application/json' },
            body: Buffer.from(JSON.stringify({ hasBody: bodyStr !== '' })).toString('base64'),
          }),
        );
      }
    });

    const resp = await tunnelFetch(name, '/api/test');
    const body = JSON.parse(resp.body) as { hasBody: boolean };
    expect(body.hasBody).toBe(false);
  });

  it('POST with empty body works', async () => {
    const name = uniqueSubdomain('empty-post');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);
    autoRespond(tunnel.ws, 200, '{"received":"empty"}');

    const resp = await tunnelFetch(name, '/api/test', {
      method: 'POST',
      body: '',
    });
    expect(resp.status).toBe(200);
  });
});
