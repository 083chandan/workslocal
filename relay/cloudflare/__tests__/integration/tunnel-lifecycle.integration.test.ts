/**
 * TunnelDO Lifecycle Integration Tests
 *
 * Tests tunnel creation, closing, disconnect handling, subdomain
 * reservation, duplicate claims, and wrong-direction message handling.
 * Runs against local wrangler dev on localhost:8787.
 */
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { WebSocket } from 'ws';

import {
  assertDevServerRunning,
  connectWS,
  sendAndWaitFor,
  createTunnel,
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

// ─── Tunnel Creation ─────────────────────────────────────────

describe('TunnelDO — creation', () => {
  it('creates tunnel with custom subdomain', async () => {
    const name = uniqueSubdomain('create');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    expect(tunnel.subdomain).toBe(name);
    expect(tunnel.publicUrl).toBe(`https://${name}.workslocal.exposed`);
    expect(tunnel.tunnelId).toBeTruthy();
    expect(tunnel.tunnelId.length).toBeGreaterThan(10);
  });

  it('creates tunnel with random subdomain when no name given', async () => {
    const ws = track(await connectWS());

    const created = await sendAndWaitFor(
      ws,
      {
        type: 'create_tunnel',
        local_port: 3000,
        domain: 'workslocal.exposed',
        client_version: '0.2.0',
        anonymous_token: `anon-${Date.now()}`,
      },
      'tunnel_created',
    );

    expect(created.subdomain).toBeDefined();
    expect((created.subdomain as string).length).toBeGreaterThanOrEqual(8);
    expect(created.subdomain).toMatch(/^[a-z0-9]+$/);
  });

  it('rejects reserved subdomain "www"', async () => {
    const ws = track(await connectWS());

    const error = await sendAndWaitFor(
      ws,
      {
        type: 'create_tunnel',
        local_port: 3000,
        custom_name: 'www',
        domain: 'workslocal.exposed',
        client_version: '0.2.0',
      },
      'error',
    );

    expect(error.code).toBe('SUBDOMAIN_RESERVED');
  });

  it('rejects reserved subdomain "api"', async () => {
    const ws = track(await connectWS());

    const error = await sendAndWaitFor(
      ws,
      {
        type: 'create_tunnel',
        local_port: 3000,
        custom_name: 'api',
        domain: 'workslocal.exposed',
        client_version: '0.2.0',
      },
      'error',
    );

    expect(error.code).toBe('SUBDOMAIN_RESERVED');
  });

  it('rejects invalid subdomain characters', async () => {
    const ws = track(await connectWS());

    const error = await sendAndWaitFor(
      ws,
      {
        type: 'create_tunnel',
        local_port: 3000,
        custom_name: 'My_App!!',
        domain: 'workslocal.exposed',
        client_version: '0.2.0',
      },
      'error',
    );

    expect(error.code).toBe('SUBDOMAIN_INVALID');
  });

  it('rejects uppercase subdomain', async () => {
    const ws = track(await connectWS());

    const error = await sendAndWaitFor(
      ws,
      {
        type: 'create_tunnel',
        local_port: 3000,
        custom_name: 'MyApp',
        domain: 'workslocal.exposed',
        client_version: '0.2.0',
      },
      'error',
    );

    expect(error.code).toBe('SUBDOMAIN_INVALID');
  });

  it('rejects leading hyphen', async () => {
    const ws = track(await connectWS());

    const error = await sendAndWaitFor(
      ws,
      {
        type: 'create_tunnel',
        local_port: 3000,
        custom_name: '-myapp',
        domain: 'workslocal.exposed',
        client_version: '0.2.0',
      },
      'error',
    );

    expect(error.code).toBe('SUBDOMAIN_INVALID');
  });

  it('rejects subdomain over 50 chars', async () => {
    const ws = track(await connectWS());

    const error = await sendAndWaitFor(
      ws,
      {
        type: 'create_tunnel',
        local_port: 3000,
        custom_name: 'a'.repeat(51),
        domain: 'workslocal.exposed',
        client_version: '0.2.0',
      },
      'error',
    );

    expect(error.code).toBe('SUBDOMAIN_INVALID');
  });

  it('rejects invalid tunnel domain', async () => {
    const ws = track(await connectWS());

    const error = await sendAndWaitFor(
      ws,
      {
        type: 'create_tunnel',
        local_port: 3000,
        custom_name: 'myapp',
        domain: 'evil.com',
        client_version: '0.2.0',
      },
      'error',
    );

    expect(error.code).toBe('DOMAIN_INVALID');
  });

  it('rejects XSS in subdomain', async () => {
    const ws = track(await connectWS());

    const error = await sendAndWaitFor(
      ws,
      {
        type: 'create_tunnel',
        local_port: 3000,
        custom_name: '<script>alert(1)</script>',
        domain: 'workslocal.exposed',
        client_version: '0.2.0',
      },
      'error',
    );

    expect(error.code).toBe('SUBDOMAIN_INVALID');
  });

  it('rejects path traversal in subdomain', async () => {
    const ws = track(await connectWS());

    const error = await sendAndWaitFor(
      ws,
      {
        type: 'create_tunnel',
        local_port: 3000,
        custom_name: '../../etc',
        domain: 'workslocal.exposed',
        client_version: '0.2.0',
      },
      'error',
    );

    expect(error.code).toBe('SUBDOMAIN_INVALID');
  });

  it('rejects second tunnel on same connection', async () => {
    const name = uniqueSubdomain('double');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    // Try creating another tunnel on the same WS
    const error = await sendAndWaitFor(
      tunnel.ws,
      {
        type: 'create_tunnel',
        local_port: 4000,
        custom_name: uniqueSubdomain('double2'),
        domain: 'workslocal.exposed',
        client_version: '0.2.0',
      },
      'error',
    );

    expect(error.code).toBe('TUNNEL_EXISTS');
  });
});

// ─── Duplicate Subdomain ─────────────────────────────────────

describe('TunnelDO — subdomain conflicts', () => {
  it('rejects duplicate subdomain from different client', async () => {
    const name = uniqueSubdomain('dupe');

    // First client takes the subdomain
    const tunnel1 = await createTunnel({ name });
    track(tunnel1.ws);

    // Second client tries same subdomain
    const ws2 = track(await connectWS());
    const error = await sendAndWaitFor(
      ws2,
      {
        type: 'create_tunnel',
        local_port: 4000,
        custom_name: name,
        domain: 'workslocal.exposed',
        client_version: '0.2.0',
        anonymous_token: `different-token-${Date.now()}`,
      },
      'error',
    );

    expect(error.code).toBe('SUBDOMAIN_TAKEN');
  });
});

// ─── Tunnel Close ────────────────────────────────────────────

describe('TunnelDO — close tunnel', () => {
  it('sends tunnel_closed on close_tunnel', async () => {
    const name = uniqueSubdomain('close');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    const closed = await sendAndWaitFor(
      tunnel.ws,
      { type: 'close_tunnel', tunnel_id: tunnel.tunnelId },
      'tunnel_closed',
    );

    expect(closed.tunnel_id).toBe(tunnel.tunnelId);
    expect(closed.reason).toBe('client_requested');
  });

  it('tunnel URL returns 404 after close', async () => {
    const name = uniqueSubdomain('close-url');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    await sendAndWaitFor(
      tunnel.ws,
      { type: 'close_tunnel', tunnel_id: tunnel.tunnelId },
      'tunnel_closed',
    );
    await delay(500);

    const resp = await tunnelFetch(name, '/api/test');
    expect(resp.status).toBe(404);
  });

  it('rejects close_tunnel with wrong tunnel_id', async () => {
    const name = uniqueSubdomain('wrong-close');
    const tunnel = await createTunnel({ name });
    track(tunnel.ws);

    const error = await sendAndWaitFor(
      tunnel.ws,
      { type: 'close_tunnel', tunnel_id: 'wrong-id' },
      'error',
    );

    expect(error.code).toBe('TUNNEL_NOT_FOUND');
  });
});

// ─── WebSocket Disconnect ────────────────────────────────────

describe('TunnelDO — WS disconnect', () => {
  it('tunnel becomes unreachable after WS closes', async () => {
    const name = uniqueSubdomain('disconnect');
    const tunnel = await createTunnel({ name });

    // Close WS without sending close_tunnel
    await closeWS(tunnel.ws);
    await delay(1000);

    const resp = await tunnelFetch(name, '/api/test');
    // Should be 404 (KV entry deleted on cleanup) or 502 (no WS)
    expect(resp.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── Heartbeat ───────────────────────────────────────────────

describe('TunnelDO — heartbeat', () => {
  it('responds to ping with pong including timestamp', async () => {
    const ws = track(await connectWS());
    const now = Date.now();

    const pong = await sendAndWaitFor(ws, { type: 'ping', timestamp: now }, 'pong');

    expect(pong.timestamp).toBe(now);
  });
});

// ─── Wrong-Direction & Malformed Messages ────────────────────

describe('TunnelDO — invalid messages', () => {
  it('returns error for unknown message type', async () => {
    const ws = track(await connectWS());

    const error = await sendAndWaitFor(ws, { type: 'exploit_attempt', payload: 'attack' }, 'error');

    expect(error.code).toBe('UNKNOWN_MESSAGE');
  });

  it('returns error for invalid JSON', async () => {
    const ws = track(await connectWS());

    const errorPromise = new Promise<Record<string, unknown>>((resolve) => {
      ws.on('message', (data: Buffer) => {
        const msg = JSON.parse(data.toString()) as Record<string, unknown>;
        if (msg.type === 'error') resolve(msg);
      });
    });

    ws.send('not json at all');

    const error = await errorPromise;
    expect(error.code).toBe('INVALID_JSON');
  });

  it('returns error for binary message', async () => {
    const ws = track(await connectWS());

    const errorPromise = new Promise<Record<string, unknown>>((resolve) => {
      ws.on('message', (data: Buffer) => {
        const msg = JSON.parse(data.toString()) as Record<string, unknown>;
        if (msg.type === 'error') resolve(msg);
      });
    });

    ws.send(Buffer.from([0x00, 0x01, 0x02]));

    const error = await errorPromise;
    expect(error.code).toBe('INVALID_MESSAGE');
  });

  it('survives rapid message burst', async () => {
    const ws = track(await connectWS());

    // Fire 50 pings rapidly
    for (let i = 0; i < 50; i++) {
      ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() + i }));
    }

    await delay(1000);

    // WS should still be alive
    const pong = await sendAndWaitFor(ws, { type: 'ping', timestamp: 999 }, 'pong');
    expect(pong.timestamp).toBe(999);
  });

  it('tunnel_created from client is treated as unknown type', async () => {
    const ws = track(await connectWS());

    const error = await sendAndWaitFor(
      ws,
      {
        type: 'tunnel_created',
        tunnel_id: 'fake',
        public_url: 'https://hacked.workslocal.exposed',
        subdomain: 'hacked',
        domain: 'workslocal.exposed',
        expires_at: new Date().toISOString(),
      },
      'error',
    );

    expect(error.code).toBe('UNKNOWN_MESSAGE');
  });

  it('http_request from client is treated as unknown type', async () => {
    const ws = track(await connectWS());

    const error = await sendAndWaitFor(
      ws,
      {
        type: 'http_request',
        request_id: 'fake',
        method: 'GET',
        path: '/hacked',
        headers: {},
        body: '',
        query: {},
      },
      'error',
    );

    expect(error.code).toBe('UNKNOWN_MESSAGE');
  });
});
