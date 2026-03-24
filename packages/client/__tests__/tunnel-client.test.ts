import { silentLogger } from '@workslocal/shared';
import { getRandomPort, delay } from '@workslocal/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketServer, type WebSocket } from 'ws';

import { TunnelClient } from '../src/tunnel-client.js';

interface WsMessage {
  type: string;
  [key: string]: unknown;
}

function parseWsMessage(data: WebSocket.RawData): WsMessage {
  const text = Buffer.isBuffer(data) ? data.toString('utf-8') : String(data as unknown);
  return JSON.parse(text) as WsMessage;
}

describe('TunnelClient', () => {
  let wss: WebSocketServer;
  let port: number;
  let serverWs: WebSocket | null;

  beforeEach(async () => {
    port = await getRandomPort();
    serverWs = null;
    wss = new WebSocketServer({ port });
    wss.on('connection', (ws) => {
      serverWs = ws;
    });
  });

  afterEach(async () => {
    wss.close();
    await delay(100);
  });

  function createClient(
    overrides: Partial<{
      serverUrl: string;
      autoReconnect: boolean;
      authToken: string;
    }> = {},
  ): TunnelClient {
    return new TunnelClient({
      serverUrl: `ws://localhost:${String(port)}`,
      logger: silentLogger,
      autoReconnect: false,
      ...overrides,
    });
  }

  function sendTunnelCreated(ws: WebSocket, tunnelId: string, subdomain: string): void {
    ws.send(
      JSON.stringify({
        type: 'tunnel_created',
        tunnel_id: tunnelId,
        public_url: `https://${subdomain}.workslocal.exposed`,
        subdomain,
        domain: 'workslocal.exposed',
        expires_at: new Date(Date.now() + 7200000).toISOString(),
      }),
    );
  }

  // ---- construction and initial state ----

  describe('construction and initial state', () => {
    it('default state is disconnected with tunnelCount 0', () => {
      const client = createClient();
      expect(client.getState()).toBe('disconnected');
      expect(client.tunnelCount).toBe(0);
    });

    it('isAuthenticated is false without authToken', () => {
      const client = createClient();
      expect(client.isAuthenticated).toBe(false);
    });

    it('isAuthenticated is true with authToken', () => {
      const client = createClient({ authToken: 'test-token' });
      expect(client.isAuthenticated).toBe(true);
    });
  });

  // ---- connection lifecycle ----

  describe('connection lifecycle', () => {
    it('connect() establishes WebSocket connection', async () => {
      const client = createClient();
      await client.connect();
      expect(serverWs).not.toBeNull();
      client.disconnect();
    });

    it('connect() emits connected event', async () => {
      const client = createClient();
      const connected = vi.fn();
      client.on('connected', connected);
      await client.connect();
      expect(connected).toHaveBeenCalledOnce();
      client.disconnect();
    });

    it('connect() transitions state to connected', async () => {
      const client = createClient();
      await client.connect();
      expect(client.getState()).toBe('connected');
      client.disconnect();
    });

    it('disconnect() transitions state to disconnected', async () => {
      const client = createClient();
      await client.connect();
      client.disconnect();
      await delay(50);
      expect(client.getState()).toBe('disconnected');
    });

    it('disconnect() emits disconnected event', async () => {
      const client = createClient();
      const disconnected = vi.fn();
      client.on('disconnected', disconnected);
      await client.connect();
      client.disconnect();
      await delay(50);
      expect(disconnected).toHaveBeenCalled();
    });

    it('connect() to non-existent port rejects', async () => {
      const client = new TunnelClient({
        serverUrl: 'ws://localhost:59999',
        logger: silentLogger,
        autoReconnect: false,
      });
      await expect(client.connect()).rejects.toThrow();
    });

    it('calling connect() when already connected is a no-op', async () => {
      const client = createClient();
      await client.connect();
      // Second call should resolve immediately without error
      await client.connect();
      expect(client.getState()).toBe('connected');
      client.disconnect();
    });
  });

  // ---- tunnel creation ----

  describe('tunnel creation', () => {
    it('createTunnel sends message and resolves with TunnelInfo', async () => {
      const client = createClient();
      await client.connect();

      serverWs!.on('message', (data: WebSocket.RawData) => {
        const msg = parseWsMessage(data);
        if (msg.type === 'create_tunnel') {
          const name = (msg.custom_name as string | undefined) ?? 'rand123';
          sendTunnelCreated(serverWs!, 'tun-123', name);
        }
      });

      const tunnel = await client.createTunnel({ port: 3000, name: 'myapp' });
      expect(tunnel.tunnelId).toBe('tun-123');
      expect(tunnel.publicUrl).toContain('myapp.workslocal.exposed');
      expect(tunnel.localPort).toBe(3000);
      expect(tunnel.subdomain).toBe('myapp');
      client.disconnect();
    });

    it('createTunnel emits tunnel:created event', async () => {
      const client = createClient();
      const tunnelCreated = vi.fn();
      client.on('tunnel:created', tunnelCreated);
      await client.connect();

      serverWs!.on('message', (data: WebSocket.RawData) => {
        const msg = parseWsMessage(data);
        if (msg.type === 'create_tunnel') {
          sendTunnelCreated(serverWs!, 'tun-456', 'test');
        }
      });

      await client.createTunnel({ port: 3000 });
      expect(tunnelCreated).toHaveBeenCalledOnce();
      client.disconnect();
    });

    it('createTunnel rejects when server returns error', async () => {
      const client = createClient();
      await client.connect();

      serverWs!.on('message', (data: WebSocket.RawData) => {
        const msg = parseWsMessage(data);
        if (msg.type === 'create_tunnel') {
          serverWs!.send(
            JSON.stringify({
              type: 'error',
              code: 'SUBDOMAIN_TAKEN',
              message: 'Subdomain is already in use',
            }),
          );
        }
      });

      await expect(client.createTunnel({ port: 3000, name: 'taken' })).rejects.toThrow(
        'SUBDOMAIN_TAKEN',
      );
      client.disconnect();
    });

    it('createTunnel rejects when not connected', async () => {
      const client = createClient();
      await expect(client.createTunnel({ port: 3000 })).rejects.toThrow(
        'Not connected to relay server',
      );
    });

    it('createTunnel sends auth_token when provided', async () => {
      const client = createClient({ authToken: 'my-token' });
      await client.connect();

      const receivedMsg = await new Promise<WsMessage>((resolve) => {
        serverWs!.on('message', (data: WebSocket.RawData) => {
          const msg = parseWsMessage(data);
          if (msg.type === 'create_tunnel') {
            // Reply so the promise resolves
            sendTunnelCreated(serverWs!, 'tun-auth', 'auth');
            resolve(msg);
          }
        });
        void client.createTunnel({ port: 3000, name: 'auth' });
      });

      expect(receivedMsg.auth_token).toBe('my-token');
      client.disconnect();
    });
  });

  // ---- tunnel closing ----

  describe('tunnel closing', () => {
    it('closeTunnel sends close_tunnel message', async () => {
      const client = createClient();
      await client.connect();

      // Set up server to create tunnel first
      serverWs!.on('message', (data: WebSocket.RawData) => {
        const msg = parseWsMessage(data);
        if (msg.type === 'create_tunnel') {
          sendTunnelCreated(serverWs!, 'tun-close', 'close');
        }
      });

      await client.createTunnel({ port: 3000 });

      const closeMsg = await new Promise<WsMessage>((resolve) => {
        serverWs!.on('message', (data: WebSocket.RawData) => {
          const msg = parseWsMessage(data);
          if (msg.type === 'close_tunnel') {
            resolve(msg);
          }
        });
        client.closeTunnel('tun-close');
      });

      expect(closeMsg.tunnel_id).toBe('tun-close');
      client.disconnect();
    });

    it('closeTunnel on unknown tunnelId is a no-op', async () => {
      const client = createClient();
      await client.connect();
      // Should not throw
      client.closeTunnel('nonexistent');
      client.disconnect();
    });
  });

  // ---- error handling ----

  describe('error handling', () => {
    it('handles malformed server messages without crashing', async () => {
      const client = createClient();
      await client.connect();

      serverWs!.send('not json at all');
      serverWs!.send('{"type": "unknown_type"}');
      serverWs!.send('{}');

      await delay(100);
      expect(client.getState()).toBe('connected');
      client.disconnect();
    });

    it('emits error event when server sends error message', async () => {
      const client = createClient();
      const errorHandler = vi.fn();
      client.on('error', errorHandler);
      await client.connect();

      serverWs!.send(
        JSON.stringify({
          type: 'error',
          code: 'RATE_LIMITED',
          message: 'Too many requests',
        }),
      );

      await delay(100);
      expect(errorHandler).toHaveBeenCalledOnce();
      const err = errorHandler.mock.calls[0]?.[0] as Error;
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain('RATE_LIMITED');
      client.disconnect();
    });
  });

  // ---- multiple tunnels ----

  describe('multiple tunnels', () => {
    it('can create and track multiple tunnels', async () => {
      const client = createClient();
      await client.connect();

      let count = 0;
      serverWs!.on('message', (data: WebSocket.RawData) => {
        const msg = parseWsMessage(data);
        if (msg.type === 'create_tunnel') {
          count++;
          sendTunnelCreated(serverWs!, `tun-${String(count)}`, `app${String(count)}`);
        }
      });

      await client.createTunnel({ port: 3000 });
      await client.createTunnel({ port: 3001 });
      expect(client.tunnelCount).toBe(2);
      expect(client.getAllTunnels()).toHaveLength(2);
      client.disconnect();
    });

    it('getAllTunnels returns created tunnels', async () => {
      const client = createClient();
      await client.connect();

      serverWs!.on('message', (data: WebSocket.RawData) => {
        const msg = parseWsMessage(data);
        if (msg.type === 'create_tunnel') {
          sendTunnelCreated(serverWs!, 'tun-get', 'get');
        }
      });

      await client.createTunnel({ port: 4000 });
      const tunnels = client.getAllTunnels();
      expect(tunnels).toHaveLength(1);
      expect(tunnels[0]!.tunnelId).toBe('tun-get');
      expect(tunnels[0]!.localPort).toBe(4000);
      client.disconnect();
    });

    it('disconnect clears all tunnels', async () => {
      const client = createClient();
      await client.connect();

      let count = 0;
      serverWs!.on('message', (data: WebSocket.RawData) => {
        const msg = parseWsMessage(data);
        if (msg.type === 'create_tunnel') {
          count++;
          sendTunnelCreated(serverWs!, `tun-dc-${String(count)}`, `dc${String(count)}`);
        }
      });

      await client.createTunnel({ port: 3000 });
      await client.createTunnel({ port: 3001 });
      expect(client.tunnelCount).toBe(2);

      client.disconnect();
      expect(client.tunnelCount).toBe(0);
      expect(client.getAllTunnels()).toHaveLength(0);
    });
  });

  // ---- event system ----

  describe('event system', () => {
    it('on/off correctly registers and removes handlers', () => {
      const client = createClient();
      const handler = vi.fn();
      client.on('connected', handler);
      client.off('connected', handler);
      // Emit manually to verify handler was removed
      client.emit('connected');
      expect(handler).not.toHaveBeenCalled();
    });

    it('event handler errors do not crash the client', async () => {
      const client = createClient();
      client.on('connected', () => {
        throw new Error('handler boom');
      });
      await client.connect();
      expect(client.getState()).toBe('connected');
      client.disconnect();
    });
  });

  // ---- server-initiated tunnel close ----

  describe('server-initiated tunnel close', () => {
    it('removes tunnel when server sends tunnel_closed', async () => {
      const client = createClient();
      const closedHandler = vi.fn();
      client.on('tunnel:closed', closedHandler);
      await client.connect();

      serverWs!.on('message', (data: WebSocket.RawData) => {
        const msg = parseWsMessage(data);
        if (msg.type === 'create_tunnel') {
          sendTunnelCreated(serverWs!, 'tun-sc', 'sc');
        }
      });

      await client.createTunnel({ port: 3000 });
      expect(client.tunnelCount).toBe(1);

      // Server closes the tunnel
      serverWs!.send(
        JSON.stringify({
          type: 'tunnel_closed',
          tunnel_id: 'tun-sc',
          reason: 'expired',
        }),
      );

      await delay(100);
      expect(client.tunnelCount).toBe(0);
      expect(closedHandler).toHaveBeenCalledWith('tun-sc', 'expired');
      client.disconnect();
    });
  });
});
