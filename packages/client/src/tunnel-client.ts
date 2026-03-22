import {
  HEARTBEAT_INTERVAL_MS,
  silentLogger,
  type WLLogger,
  type HttpRequestMessage,
  type ServerMessage,
  type ClientMessage,
} from '@workslocal/shared';
import WebSocket from 'ws';

import { getAnonymousToken } from './auth.js';
import { createLocalProxy, type LocalProxy } from './local-proxy.js';
import { createRequestStore, type RequestStore } from './request-store.js';
import type {
  CapturedRequest,
  ConnectionState,
  TunnelClientEvents,
  TunnelClientOptions,
  TunnelInfo,
} from './types.js';

// ─── Typed event emitter ─────────────────────────────────

type EventHandler<T extends (...args: never[]) => void> = T;
type EventMap = { [K in keyof TunnelClientEvents]: Set<EventHandler<TunnelClientEvents[K]>> };

// ─── Reconnect config ────────────────────────────────────

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

/**
 * WorksLocal Tunnel Client.
 *
 * Core client library used by both CLI and desktop app.
 * Manages WebSocket connection to the relay server, handles
 * tunnel creation/closing, heartbeat, auto-reconnect, local HTTP
 * proxying, and request capture.
 *
 *  additions:
 * - authToken option: API key (wl_k_...) passed in create_tunnel
 * - isPersistent tracking on TunnelInfo
 * - Anonymous token always sent as fallback
 *
 * Usage:
 * ```typescript
 * const client = new TunnelClient({
 *   serverUrl: "wss://api.workslocal.dev/ws",
 *   authToken: "wl_k_abc123...",  // optional - omit for anonymous
 * });
 * client.on("tunnel:created", (tunnel) => console.log(tunnel.publicUrl));
 * await client.connect();
 * await client.createTunnel({ port: 3000, name: "myapp" });
 * ```
 */
export class TunnelClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private readonly log: WLLogger;
  private readonly serverUrl: string;
  private readonly clientVersion: string;
  private readonly autoReconnect: boolean;
  private readonly maxReconnectAttempts: number;
  private readonly authToken: string | undefined;
  private reconnectAttempt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private autoReconnectEnabled = true;

  // Tunnel state
  private readonly tunnels = new Map<string, TunnelInfo>();
  private readonly portMap = new Map<string, number>(); // tunnelId → localPort
  private pendingPort: number | null = null;

  // Components
  private readonly localProxy: LocalProxy;
  readonly requestStore: RequestStore;

  // Event system
  private readonly listeners: EventMap = {
    connected: new Set(),
    disconnected: new Set(),
    reconnecting: new Set(),
    reconnect_failed: new Set(),
    'tunnel:created': new Set(),
    'tunnel:closed': new Set(),
    'request:start': new Set(),
    'request:complete': new Set(),
    'request:error': new Set(),
    error: new Set(),
  };

  constructor(options: TunnelClientOptions) {
    this.serverUrl = options.serverUrl;
    this.log = options.logger ?? silentLogger;
    this.clientVersion = options.clientVersion ?? '0.0.1';
    this.autoReconnect = options.autoReconnect ?? true;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;
    this.authToken = options.authToken;

    this.localProxy = createLocalProxy({ logger: this.log });
    this.requestStore = createRequestStore();
  }

  // ─── Public: Auth status ───────────────────────────────

  /**
   * Whether this client has an auth token (logged in).
   */
  get isAuthenticated(): boolean {
    return Boolean(this.authToken);
  }

  // ─── Event system ──────────────────────────────────────

  on<K extends keyof TunnelClientEvents>(event: K, handler: TunnelClientEvents[K]): void {
    (this.listeners[event] as Set<TunnelClientEvents[K]>).add(handler);
  }

  off<K extends keyof TunnelClientEvents>(event: K, handler: TunnelClientEvents[K]): void {
    (this.listeners[event] as Set<TunnelClientEvents[K]>).delete(handler);
  }

  private emit<K extends keyof TunnelClientEvents>(
    event: K,
    ...args: Parameters<TunnelClientEvents[K]>
  ): void {
    for (const handler of this.listeners[event]) {
      try {
        (handler as (...a: Parameters<TunnelClientEvents[K]>) => void)(...args);
      } catch (err) {
        this.log.error('Event handler error', {
          event,
          err: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // ─── Connection ────────────────────────────────────────

  /**
   * Connect to the relay server.
   * Returns a Promise that resolves when the WebSocket is open.
   */
  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      return;
    }

    this.state = 'connecting';

    return new Promise<void>((resolve, reject) => {
      this.log.info('Connecting to relay server', { url: this.serverUrl });

      this.ws = new WebSocket(this.serverUrl);

      this.ws.on('open', () => {
        this.state = 'connected';
        this.reconnectAttempt = 0;
        this.startHeartbeat();
        this.log.info('Connected to relay server');
        this.emit('connected');
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        let raw: string;
        if (typeof data === 'string') {
          raw = data;
        } else if (Buffer.isBuffer(data)) {
          raw = data.toString('utf-8');
        } else if (Array.isArray(data)) {
          raw = Buffer.concat(data).toString('utf-8');
        } else {
          raw = Buffer.from(data).toString('utf-8');
        }
        void this.handleMessage(raw);
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        const reasonStr = reason.toString('utf-8') || 'unknown';
        this.state = 'disconnected';
        this.stopHeartbeat();

        this.log.info('Disconnected from relay server', {
          code: String(code),
          reason: reasonStr,
        });
        this.emit('disconnected', code, reasonStr);

        if (this.autoReconnect && this.autoReconnectEnabled && code !== 1000) {
          void this.attemptReconnect();
        }
      });

      this.ws.on('error', (err: Error) => {
        this.log.error('WebSocket error', { err: err.message });
        this.emit('error', err);

        if (this.state === 'connecting') {
          reject(err);
        }
      });
    });
  }

  /**
   * Disconnect from the relay server.
   * Closes all tunnels and stops heartbeat.
   */
  disconnect(): void {
    this.autoReconnectEnabled = false;

    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      for (const tunnelId of this.tunnels.keys()) {
        this.send({ type: 'close_tunnel', tunnel_id: tunnelId });
      }
      this.ws.close(1000, 'Client disconnect');
    }

    this.tunnels.clear();
    this.portMap.clear();
    this.state = 'disconnected';
  }

  // ─── Tunnel management ─────────────────────────────────

  /**
   * Create a new tunnel.
   * Returns a Promise that resolves with the tunnel info.
   *
   * If authToken is set, sends it in create_tunnel for persistent subdomain.
   * Always sends anonymous_token as fallback for subdomain reclaim.
   */
  async createTunnel(options: {
    port: number;
    name?: string | undefined;
    domain?: string | undefined;
  }): Promise<TunnelInfo> {
    if (this.state !== 'connected') {
      throw new Error('Not connected to relay server');
    }

    return new Promise<TunnelInfo>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.off('tunnel:created', handler);
        this.off('error', errorHandler);
        reject(new Error('Tunnel creation timed out'));
      }, 10_000);

      const handler = (tunnel: TunnelInfo): void => {
        clearTimeout(timeout);
        this.off('tunnel:created', handler);
        this.off('error', errorHandler);
        resolve(tunnel);
      };

      const errorHandler = (err: Error): void => {
        clearTimeout(timeout);
        this.off('tunnel:created', handler);
        this.off('error', errorHandler);
        reject(err);
      };

      this.on('tunnel:created', handler);
      this.on('error', errorHandler);

      // Build create_tunnel message (snake_case wire format)
      const msg: Record<string, unknown> = {
        type: 'create_tunnel',
        local_port: options.port,
        custom_name: options.name,
        domain: options.domain,
        client_version: this.clientVersion,
        anonymous_token: getAnonymousToken(),
      };

      // : include auth token if logged in
      if (this.authToken) {
        msg.auth_token = this.authToken;
      }

      this.pendingPort = options.port;
      this.send(msg as unknown as ClientMessage);
    });
  }

  /**
   * Close a tunnel by ID.
   */
  closeTunnel(tunnelId: string): void {
    if (!this.tunnels.has(tunnelId)) {
      this.log.warn('Tunnel not found', { tunnelId });
      return;
    }
    this.send({ type: 'close_tunnel', tunnel_id: tunnelId });
  }

  /**
   * Close all tunnels.
   */
  closeAll(): void {
    for (const tunnelId of this.tunnels.keys()) {
      this.closeTunnel(tunnelId);
    }
  }

  /**
   * Get info about a specific tunnel.
   */
  getTunnel(tunnelId: string): TunnelInfo | undefined {
    return this.tunnels.get(tunnelId);
  }

  /**
   * Get all active tunnels.
   */
  getAllTunnels(): readonly TunnelInfo[] {
    return [...this.tunnels.values()];
  }

  /**
   * Get current connection state.
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get count of active tunnels.
   */
  get tunnelCount(): number {
    return this.tunnels.size;
  }

  // ─── Message handling ──────────────────────────────────

  private async handleMessage(raw: string): Promise<void> {
    let msg: ServerMessage;
    try {
      msg = JSON.parse(raw) as ServerMessage;
    } catch {
      this.log.warn('Invalid JSON from server', { raw: raw.slice(0, 100) });
      return;
    }

    switch (msg.type) {
      case 'tunnel_created':
        this.handleTunnelCreated(msg);
        break;

      case 'tunnel_closed':
        this.handleTunnelClosed(msg);
        break;

      case 'http_request':
        await this.handleHttpRequest(msg);
        break;

      case 'pong':
        // Heartbeat acknowledged
        break;

      case 'error':
        this.handleError(msg);
        break;

      case 'domains_updated':
        this.log.info('Domains updated', { domains: msg.domains });
        break;

      default:
        this.log.warn('Unknown message type from server', {
          type: (msg as { type: string }).type,
        });
    }
  }

  private handleTunnelCreated(msg: {
    tunnel_id: string;
    public_url: string;
    subdomain: string;
    domain: string;
    expires_at: string;
    is_persistent?: boolean;
    user_id?: string | null;
  }): void {
    const tunnel: TunnelInfo = {
      tunnelId: msg.tunnel_id,
      publicUrl: msg.public_url,
      subdomain: msg.subdomain,
      domain: msg.domain,
      localPort: this.pendingPort ?? 0,
      expiresAt: msg.expires_at || null,
      isPersistent: msg.is_persistent ?? false,
      userId: msg.user_id ?? null,
      createdAt: new Date(),
    };

    this.tunnels.set(tunnel.tunnelId, tunnel);
    this.portMap.set(tunnel.tunnelId, tunnel.localPort);
    this.pendingPort = null;

    this.log.info('Tunnel created', {
      tunnelId: tunnel.tunnelId,
      publicUrl: tunnel.publicUrl,
      isPersistent: String(tunnel.isPersistent),
    });

    this.emit('tunnel:created', tunnel);
  }

  private handleTunnelClosed(msg: { tunnel_id: string; reason: string }): void {
    const tunnel = this.tunnels.get(msg.tunnel_id);
    this.tunnels.delete(msg.tunnel_id);
    this.portMap.delete(msg.tunnel_id);

    this.log.info('Tunnel closed', {
      tunnelId: msg.tunnel_id,
      reason: msg.reason,
      subdomain: tunnel?.subdomain ?? 'unknown',
    });

    this.emit('tunnel:closed', msg.tunnel_id, msg.reason);
  }

  private async handleHttpRequest(msg: HttpRequestMessage): Promise<void> {
    const startTime = Date.now();

    // Find which local port this tunnel maps to.
    // http_request doesn't include tunnel_id - use first tunnel on this connection.
    let localPort = 0;
    let tunnelId = '';
    for (const [id, port] of this.portMap.entries()) {
      localPort = port;
      tunnelId = id;
      break;
    }

    if (localPort === 0) {
      this.log.warn('No tunnel found for incoming request', {
        requestId: msg.request_id,
      });
      this.send({
        type: 'http_response',
        request_id: msg.request_id,
        status_code: 502,
        headers: { 'content-type': 'text/plain' },
        body: Buffer.from('No active tunnel').toString('base64'),
      });
      return;
    }

    this.emit('request:start', msg.request_id, msg.method, msg.path);

    try {
      const response = await this.localProxy.forward(msg, localPort);
      const durationMs = Date.now() - startTime;

      this.send({
        type: 'http_response',
        request_id: msg.request_id,
        status_code: response.statusCode,
        headers: response.headers,
        body: response.body,
      });

      const captured: CapturedRequest = {
        requestId: msg.request_id,
        tunnelId,
        method: msg.method,
        path: msg.path,
        query: msg.query,
        requestHeaders: msg.headers,
        requestBody: msg.body,
        responseStatusCode: response.statusCode,
        responseHeaders: response.headers,
        responseBody: response.body,
        responseTimeMs: durationMs,
        timestamp: new Date(),
      };

      this.requestStore.add(captured);
      this.emit('request:complete', captured);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      this.log.error('Failed to forward request', {
        requestId: msg.request_id,
        err: errMessage,
      });

      this.send({
        type: 'http_response',
        request_id: msg.request_id,
        status_code: 502,
        headers: { 'content-type': 'text/plain' },
        body: Buffer.from(`Proxy error: ${errMessage}`).toString('base64'),
      });

      this.emit('request:error', msg.request_id, errMessage);
    }
  }

  private handleError(msg: { code: string; message: string }): void {
    this.log.warn('Server error', { code: msg.code, message: msg.message });
    this.emit('error', new Error(`[${msg.code}] ${msg.message}`));
  }

  // ─── Heartbeat ─────────────────────────────────────────

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, HEARTBEAT_INTERVAL_MS);

    this.heartbeatTimer.unref();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ─── Reconnect ─────────────────────────────────────────

  private async attemptReconnect(): Promise<void> {
    if (!this.autoReconnectEnabled) return;
    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      this.log.error('Max reconnect attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempt++;
    this.state = 'reconnecting';

    const delay = Math.min(
      RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempt - 1),
      RECONNECT_MAX_MS,
    );

    this.log.info('Reconnecting', {
      attempt: String(this.reconnectAttempt),
      maxAttempts: String(this.maxReconnectAttempts),
      delayMs: String(delay),
    });

    this.emit('reconnecting', this.reconnectAttempt, this.maxReconnectAttempts);

    await new Promise<void>((resolve) => {
      this.reconnectTimer = setTimeout(resolve, delay);
      this.reconnectTimer.unref();
    });

    try {
      await this.connect();

      // Re-create tunnels that were active before disconnect
      const previousTunnels = [...this.tunnels.values()];
      this.tunnels.clear();
      this.portMap.clear();

      for (const tunnel of previousTunnels) {
        try {
          await this.createTunnel({
            port: tunnel.localPort,
            name: tunnel.subdomain,
            domain: tunnel.domain,
          });
          this.log.info('Tunnel re-created after reconnect', {
            subdomain: tunnel.subdomain,
          });
        } catch (err) {
          this.log.warn('Failed to re-create tunnel after reconnect', {
            subdomain: tunnel.subdomain,
            err: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } catch {
      // connect() failed - will trigger another reconnect via close handler
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ─── Send ──────────────────────────────────────────────

  /**
   * Send a message to the relay server.
   * All outgoing messages go through here.
   */
  private send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.log.warn('Cannot send - WebSocket not open', {
        type: msg.type,
        state: String(this.ws?.readyState ?? 'null'),
      });
    }
  }
}
