import type { WLLogger } from '@workslocal/shared';

// --- Connection state ---
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// --- Tunnel info (what the client tracks internally) ---
export interface TunnelInfo {
  readonly tunnelId: string;
  readonly publicUrl: string;
  readonly subdomain: string;
  readonly domain: string;
  readonly localPort: number;
  readonly expiresAt: string | null;
  readonly createdAt: Date;
}

// --- Captured request/response pair ---
export interface CapturedRequest {
  readonly requestId: string;
  readonly tunnelId: string;
  readonly method: string;
  readonly path: string;
  readonly query: Record<string, string>;
  readonly requestHeaders: Record<string, string>;
  readonly requestBody: string; // base64
  readonly responseStatusCode: number;
  readonly responseHeaders: Record<string, string>;
  readonly responseBody: string; // base64
  readonly responseTimeMs: number;
  readonly timestamp: Date;
}

// --- Client options ---
export interface TunnelClientOptions {
  /** Relay server URL (e.g., "ws://localhost:3000/ws" or "wss://api.workslocal.dev/ws") */
  serverUrl: string;
  /** Logger instance — CLI passes chalk logger, desktop passes file logger, tests pass silent */
  logger?: WLLogger | undefined;
  /** Client version string sent in create_tunnel */
  clientVersion?: string | undefined;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean | undefined;
  /** Max reconnect attempts (default: 10) */
  maxReconnectAttempts?: number | undefined;
}

// --- Events emitted by TunnelClient ---
export interface TunnelClientEvents {
  connected: () => void;
  disconnected: (code: number, reason: string) => void;
  reconnecting: (attempt: number, maxAttempts: number) => void;
  reconnect_failed: () => void;
  'tunnel:created': (tunnel: TunnelInfo) => void;
  'tunnel:closed': (tunnelId: string, reason: string) => void;
  'request:start': (requestId: string, method: string, path: string) => void;
  'request:complete': (captured: CapturedRequest) => void;
  'request:error': (requestId: string, error: string) => void;
  error: (error: Error) => void;
}
