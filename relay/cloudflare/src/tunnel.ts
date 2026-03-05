import {
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_REGEX,
  SUBDOMAIN_RESERVATION_MS,
  MAX_PAYLOAD_BYTES,
} from '@workslocal/shared';

import type { Env } from './types.js';
import { generateId } from './utils/id.js';
import { createWorkerLogger } from './utils/logger.js';

// ─── Types for wire-format messages (snake_case) ─────────

interface WireCreateTunnel {
  type: 'create_tunnel';
  local_port: number;
  custom_name?: string;
  domain?: string;
  client_version: string;
  anonymous_token?: string;
}

interface WireCloseTunnel {
  type: 'close_tunnel';
  tunnel_id: string;
}

interface WireHttpResponse {
  type: 'http_response';
  request_id: string;
  status_code: number;
  headers: Record<string, string>;
  body: string;
}

interface WirePing {
  type: 'ping';
  timestamp: number;
}

type WireClientMessage = WireCreateTunnel | WireCloseTunnel | WireHttpResponse | WirePing;

// ─── Pending HTTP request tracking ───────────────────────

interface PendingRequest {
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  createdAt: number;
}

// ─── Tunnel state ────────────────────────────────────────

interface TunnelInfo {
  tunnelId: string;
  subdomain: string;
  domain: string;
  localPort: number;
  anonymousToken: string | null;
  createdAt: string;
}

/**
 * TunnelDO — one Durable Object per WebSocket connection.
 *
 * Keyed by "conn:{connectionId}". Holds the WebSocket to the CLI client.
 * When the client creates a tunnel, writes to KV so the Worker can
 * route tunnel HTTP traffic back to this DO.
 *
 * Uses the WebSocket Hibernation API — the DO can sleep between messages.
 * State (tunnel info, connectionId) is persisted to DO storage so it
 * survives hibernation. WebSockets are managed by the runtime and
 * retrieved via this.state.getWebSockets().
 *
 * Lifecycle:
 * 1. Client connects via WebSocket
 * 2. Client sends create_tunnel → DO validates, writes KV, responds tunnel_created
 * 3. Worker receives tunnel HTTP → reads KV → forwards to this DO
 * 4. DO serializes HTTP as JSON → sends over WS → client responds → DO returns HTTP
 * 5. Client disconnects → DO deletes KV → sets alarm for subdomain reservation
 * 6. Alarm fires (5 min) → reservation released
 */
export class TunnelDO implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private connectionId: string | null = null;
  private tunnel: TunnelInfo | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private log = createWorkerLogger('tunnel-do');

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    // Restore state from DO storage (survives hibernation)
    void this.state.blockConcurrencyWhile(async () => {
      this.tunnel = (await this.state.storage.get<TunnelInfo>('tunnel')) ?? null;
      this.connectionId = (await this.state.storage.get<string>('connectionId')) ?? null;
    });
  }

  // ─── Get active WebSocket (Hibernation API) ──────────────

  /**
   * Get the active WebSocket connection.
   * Uses the Hibernation API — WebSockets survive DO hibernation.
   * The runtime manages the WebSocket; we retrieve it on wake.
   */
  private getWebSocket(): WebSocket | null {
    const sockets = this.state.getWebSockets();
    return sockets.length > 0 ? sockets[0]! : null;
  }

  // ─── Fetch handler ───────────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    const requestType = request.headers.get('X-Tunnel-Request-Type');

    if (requestType === 'http') {
      // This is tunnel HTTP traffic forwarded by the Worker
      return this.handleTunnelHttp(request);
    }

    // Check for WebSocket upgrade
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader?.toLowerCase() === 'websocket') {
      return this.handleWebSocketUpgrade(request);
    }

    // Regular HTTP to the DO (status check)
    return Response.json({
      ok: true,
      data: {
        hasConnection: this.getWebSocket() !== null,
        tunnel: this.tunnel
          ? {
              tunnelId: this.tunnel.tunnelId,
              subdomain: this.tunnel.subdomain,
              domain: this.tunnel.domain,
            }
          : null,
      },
    });
  }

  // ─── WebSocket Handling ──────────────────────────────────

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    // Close any existing WebSocket (one connection per DO)
    const existingWs = this.getWebSocket();
    if (existingWs) {
      try {
        existingWs.close(1000, 'New connection replacing old one');
      } catch {
        // Already closed
      }
    }

    this.connectionId = request.headers.get('X-Connection-Id') ?? crypto.randomUUID();

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    // Accept the server side (Hibernation API)
    this.state.acceptWebSocket(server);

    // Persist connectionId to DO storage (survives hibernation)
    await this.state.storage.put('connectionId', this.connectionId);

    this.log.info('WebSocket connected', { connectionId: this.connectionId ?? 'unknown' });

    // Return the client side to the caller
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Called by the Workers runtime when a WebSocket message is received.
   * Part of the WebSocket Hibernation API — called even after hibernation.
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') {
      this.sendError(ws, 'INVALID_MESSAGE', 'Binary messages not supported');
      return;
    }

    let msg: WireClientMessage;
    try {
      msg = JSON.parse(message) as WireClientMessage;
    } catch {
      this.sendError(ws, 'INVALID_JSON', 'Invalid JSON message');
      return;
    }

    switch (msg.type) {
      case 'create_tunnel':
        await this.handleCreateTunnel(ws, msg);
        break;

      case 'close_tunnel':
        await this.handleCloseTunnel(ws, msg);
        break;

      case 'http_response':
        this.handleHttpResponse(msg);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: msg.timestamp }));
        break;

      default:
        this.sendError(
          ws,
          'UNKNOWN_MESSAGE',
          `Unknown message type: ${(msg as { type: string }).type}`,
        );
    }
  }

  /**
   * Called when the WebSocket is closed.
   * Part of the WebSocket Hibernation API.
   */
  async webSocketClose(_ws: WebSocket, code: number, reason: string): Promise<void> {
    this.log.info('WebSocket closed', {
      connectionId: this.connectionId ?? 'unknown',
      code: String(code),
      reason,
    });
    await this.cleanup();
  }

  /**
   * Called when the WebSocket encounters an error.
   * Part of the WebSocket Hibernation API.
   */
  async webSocketError(_ws: WebSocket, error: unknown): Promise<void> {
    this.log.error('WebSocket error', {
      connectionId: this.connectionId ?? 'unknown',
      err: String(error),
    });
    await this.cleanup();
  }

  // ─── Tunnel Creation ─────────────────────────────────────

  private async handleCreateTunnel(ws: WebSocket, msg: WireCreateTunnel): Promise<void> {
    // Already has a tunnel
    if (this.tunnel) {
      this.sendError(ws, 'TUNNEL_EXISTS', 'This connection already has an active tunnel');
      return;
    }

    const domain = msg.domain ?? 'workslocal.exposed';
    const tunnelDomains = this.env.TUNNEL_DOMAINS.split(',').map((d) => d.trim());

    // Validate domain
    if (!tunnelDomains.includes(domain)) {
      this.sendError(ws, 'DOMAIN_INVALID', `Invalid domain: ${domain}`);
      return;
    }

    // Determine subdomain
    let subdomain: string;
    if (msg.custom_name) {
      // Validate custom subdomain
      if (!SUBDOMAIN_REGEX.test(msg.custom_name)) {
        this.sendError(
          ws,
          'SUBDOMAIN_INVALID',
          'Subdomain must be lowercase alphanumeric with optional hyphens (1-50 chars)',
        );
        return;
      }
      if (RESERVED_SUBDOMAINS.includes(msg.custom_name as (typeof RESERVED_SUBDOMAINS)[number])) {
        this.sendError(ws, 'SUBDOMAIN_RESERVED', `Subdomain "${msg.custom_name}" is reserved`);
        return;
      }
      subdomain = msg.custom_name;
    } else {
      // Generate random subdomain
      subdomain = generateRandomSubdomain();
    }

    // Check if subdomain is taken (KV lookup)
    const kvKey = `tunnel:${domain}:${subdomain}`;
    const existing = await this.env.KV.get(kvKey);

    if (existing) {
      // Check if it's a reservation from the same anonymous token
      const reservationKey = `reserved:${domain}:${subdomain}`;
      const reservedBy = await this.env.KV.get(reservationKey);

      if (reservedBy && reservedBy === msg.anonymous_token) {
        // Same user reclaiming — allow it, delete the old tunnel key and reservation
        await this.env.KV.delete(reservationKey);
        await this.env.KV.delete(kvKey);
      } else if (!reservedBy) {
        // No reservation — subdomain is actively in use by someone else
        this.sendError(ws, 'SUBDOMAIN_TAKEN', `Subdomain "${subdomain}" is already in use`);
        return;
      } else {
        // Reserved by a different user
        this.sendError(ws, 'SUBDOMAIN_TAKEN', `Subdomain "${subdomain}" is temporarily reserved`);
        return;
      }
    }

    // Also check if there's a reservation without an active tunnel
    const reservationKey = `reserved:${domain}:${subdomain}`;
    const reservedBy = await this.env.KV.get(reservationKey);
    if (reservedBy && reservedBy !== msg.anonymous_token) {
      this.sendError(ws, 'SUBDOMAIN_TAKEN', `Subdomain "${subdomain}" is temporarily reserved`);
      return;
    }
    if (reservedBy && reservedBy === msg.anonymous_token) {
      await this.env.KV.delete(reservationKey);
    }

    // Register tunnel in KV — maps subdomain to this DO's connection name
    const connectionName = `conn:${this.connectionId}`;
    await this.env.KV.put(kvKey, connectionName, {
      // Anonymous tunnels expire after 2 hours
      expirationTtl: 7200,
    });

    // Store tunnel info in memory and DO storage
    const tunnelId = generateId();
    const publicUrl = `https://${subdomain}.${domain}`;

    this.tunnel = {
      tunnelId,
      subdomain,
      domain,
      localPort: msg.local_port,
      anonymousToken: msg.anonymous_token ?? null,
      createdAt: new Date().toISOString(),
    };

    // Persist to DO storage (survives hibernation)
    await this.state.storage.put('tunnel', this.tunnel);

    // Cancel any pending alarm from a previous disconnect
    await this.state.storage.deleteAlarm();

    // Send tunnel_created (snake_case wire format)
    ws.send(
      JSON.stringify({
        type: 'tunnel_created',
        tunnel_id: tunnelId,
        public_url: publicUrl,
        subdomain,
        domain,
        expires_at: new Date(Date.now() + 7200_000).toISOString(),
      }),
    );

    this.log.info('Tunnel created', { publicUrl, connectionId: this.connectionId ?? 'unknown' });
  }

  // ─── Tunnel Closing ──────────────────────────────────────

  private async handleCloseTunnel(ws: WebSocket, msg: WireCloseTunnel): Promise<void> {
    if (!this.tunnel || this.tunnel.tunnelId !== msg.tunnel_id) {
      this.sendError(ws, 'TUNNEL_NOT_FOUND', 'Tunnel not found on this connection');
      return;
    }

    const tunnelId = this.tunnel.tunnelId;
    await this.removeTunnel('client_requested');

    ws.send(
      JSON.stringify({
        type: 'tunnel_closed',
        tunnel_id: tunnelId,
        reason: 'client_requested',
      }),
    );
  }

  // ─── HTTP Response from Client ───────────────────────────

  private handleHttpResponse(msg: WireHttpResponse): void {
    const pending = this.pendingRequests.get(msg.request_id);
    if (!pending) {
      this.log.warn('No pending request', { requestId: msg.request_id });
      return;
    }

    clearTimeout(pending.timer);
    this.pendingRequests.delete(msg.request_id);

    // Decode base64 body
    let bodyBytes: Uint8Array | null = null;
    if (msg.body) {
      try {
        const binaryString = atob(msg.body);
        bodyBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bodyBytes[i] = binaryString.charCodeAt(i);
        }
      } catch {
        this.log.warn('Failed to decode base64 body', { requestId: msg.request_id });
      }
    }

    // Build response headers
    const headers = new Headers(msg.headers);
    // Remove hop-by-hop headers
    headers.delete('transfer-encoding');
    headers.delete('connection');
    headers.delete('keep-alive');

    // Add tunnel response headers
    headers.set('X-Tunnel-Response', 'true');

    const response = new Response(bodyBytes, {
      status: msg.status_code,
      headers,
    });

    pending.resolve(response);
  }

  // ─── Tunnel HTTP Traffic (forwarded by Worker) ───────────

  private async handleTunnelHttp(request: Request): Promise<Response> {
    const ws = this.getWebSocket();

    if (!ws) {
      return Response.json(
        {
          ok: false,
          error: {
            code: 'TUNNEL_NOT_CONNECTED',
            message: 'Tunnel client is not connected',
          },
        },
        { status: 502 },
      );
    }

    // Verify WebSocket is open
    if (ws.readyState !== WebSocket.READY_STATE_OPEN) {
      return Response.json(
        {
          ok: false,
          error: {
            code: 'TUNNEL_NOT_CONNECTED',
            message: 'Tunnel client WebSocket is not open',
          },
        },
        { status: 502 },
      );
    }

    const requestId = crypto.randomUUID();
    const url = new URL(request.url);

    // Read request body as base64
    let bodyBase64 = '';
    if (request.body) {
      const bodyBytes = await request.arrayBuffer();
      if (bodyBytes.byteLength > MAX_PAYLOAD_BYTES) {
        return Response.json(
          {
            ok: false,
            error: {
              code: 'PAYLOAD_TOO_LARGE',
              message: 'Request body exceeds 10MB limit',
            },
          },
          { status: 413 },
        );
      }
      if (bodyBytes.byteLength > 0) {
        const bytes = new Uint8Array(bodyBytes);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]!);
        }
        bodyBase64 = btoa(binary);
      }
    }

    // Extract headers as plain object (skip internal/hop-by-hop headers)
    const headers: Record<string, string> = {};
    for (const [key, value] of request.headers.entries()) {
      const lower = key.toLowerCase();
      if (
        lower === 'host' ||
        lower === 'connection' ||
        lower === 'upgrade' ||
        lower === 'transfer-encoding' ||
        lower.startsWith('x-tunnel-') ||
        lower.startsWith('cf-')
      )
        continue;
      headers[lower] = value;
    }

    // Extract query params
    const query: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      query[key] = value;
    }

    // Build the http_request message (snake_case wire format)
    const httpRequestMsg = JSON.stringify({
      type: 'http_request',
      request_id: requestId,
      method: request.method,
      path: url.pathname,
      headers,
      body: bodyBase64,
      query,
    });

    // Create a promise that resolves when the client sends http_response
    return new Promise<Response>((resolve) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        resolve(
          Response.json(
            {
              ok: false,
              error: {
                code: 'GATEWAY_TIMEOUT',
                message: 'Tunnel client did not respond within 30 seconds',
              },
            },
            { status: 504 },
          ),
        );
      }, 30_000);

      this.pendingRequests.set(requestId, {
        resolve,
        reject: () => {}, // Not used — we always resolve (even errors are HTTP responses)
        timer,
        createdAt: Date.now(),
      });

      try {
        ws.send(httpRequestMsg);
      } catch {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        resolve(
          Response.json(
            {
              ok: false,
              error: {
                code: 'WS_SEND_FAILED',
                message: 'Failed to send request to tunnel client',
              },
            },
            { status: 502 },
          ),
        );
      }
    });
  }

  // ─── Cleanup ─────────────────────────────────────────────

  private async cleanup(): Promise<void> {
    // Reject all pending HTTP requests
    for (const [_requestId, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.resolve(
        Response.json(
          {
            ok: false,
            error: {
              code: 'CONNECTION_CLOSED',
              message: 'Tunnel client disconnected',
            },
          },
          { status: 502 },
        ),
      );
    }
    this.pendingRequests.clear();

    // Remove tunnel from KV and set reservation
    if (this.tunnel) {
      await this.removeTunnel('client_disconnected');
    }

    // Clean up persisted state
    await this.state.storage.delete('connectionId');
    this.connectionId = null;
  }

  private async removeTunnel(reason: string): Promise<void> {
    if (!this.tunnel) return;

    const { subdomain, domain, anonymousToken } = this.tunnel;
    const kvKey = `tunnel:${domain}:${subdomain}`;

    // Remove active tunnel from KV
    await this.env.KV.delete(kvKey);

    // Set subdomain reservation (5 min) if we have an anonymous token
    if (anonymousToken) {
      const reservationKey = `reserved:${domain}:${subdomain}`;
      await this.env.KV.put(reservationKey, anonymousToken, {
        expirationTtl: Math.floor(SUBDOMAIN_RESERVATION_MS / 1000),
      });

      // Set alarm as backup cleanup for DO garbage collection
      await this.state.storage.setAlarm(Date.now() + SUBDOMAIN_RESERVATION_MS);
    }

    this.log.info('Tunnel removed', { subdomain, domain, reason });

    // Clear tunnel state from memory and storage
    this.tunnel = null;
    await this.state.storage.delete('tunnel');
  }

  // ─── Alarm ───────────────────────────────────────────────

  /**
   * Alarm fires after 5-min reservation timeout.
   * By this point, KV reservation key has already expired (TTL).
   * The alarm just ensures the DO can be garbage collected.
   */
  async alarm(): Promise<void> {
    this.log.info('Alarm fired — reservation expired', {
      connectionId: this.connectionId ?? 'unknown',
    });

    // If there's still a tunnel (shouldn't be, but belt-and-suspenders)
    if (this.tunnel) {
      await this.removeTunnel('alarm_expired');
    }

    // Clean up all persisted state so DO can be garbage collected
    await this.state.storage.deleteAll();
    this.tunnel = null;
    this.connectionId = null;
  }

  // ─── Helpers ─────────────────────────────────────────────

  private sendError(ws: WebSocket, code: string, message: string): void {
    try {
      ws.send(JSON.stringify({ type: 'error', code, message }));
    } catch {
      this.log.warn('Failed to send error to WebSocket', { code, message });
    }
  }
}

// ─── Random subdomain generator ────────────────────────────

function generateRandomSubdomain(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}
