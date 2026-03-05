// --- Client → Server ---

export interface CreateTunnelMessage {
  readonly type: 'create_tunnel';
  readonly local_port: number;
  readonly custom_name?: string | undefined;
  readonly domain?: string | undefined;
  readonly client_version: string;
  readonly anonymous_token?: string | undefined;
}

export interface CloseTunnelMessage {
  readonly type: 'close_tunnel';
  readonly tunnel_id: string;
}

export interface HttpResponseMessage {
  readonly type: 'http_response';
  readonly request_id: string;
  readonly status_code: number;
  readonly headers: Record<string, string>;
  readonly body: string;
}

export interface PingMessage {
  readonly type: 'ping';
  readonly timestamp: number;
}

export type ClientMessage =
  | CreateTunnelMessage
  | CloseTunnelMessage
  | HttpResponseMessage
  | PingMessage;

// --- Server → Client ---

export interface TunnelCreatedMessage {
  readonly type: 'tunnel_created';
  readonly tunnel_id: string;
  readonly public_url: string;
  readonly subdomain: string;
  readonly domain: string;
  readonly expires_at: string;
}

export interface TunnelClosedMessage {
  readonly type: 'tunnel_closed';
  readonly tunnel_id: string;
  readonly reason: string;
}

export interface HttpRequestMessage {
  readonly type: 'http_request';
  readonly request_id: string;
  readonly method: string;
  readonly path: string;
  readonly headers: Record<string, string>;
  readonly body: string;
  readonly query: Record<string, string>;
}

export interface PongMessage {
  readonly type: 'pong';
  readonly timestamp: number;
}

export interface ErrorMessage {
  readonly type: 'error';
  readonly code: string;
  readonly message: string;
}

export interface DomainsUpdatedMessage {
  readonly type: 'domains_updated';
  readonly domains: readonly string[];
}

export type ServerMessage =
  | TunnelCreatedMessage
  | TunnelClosedMessage
  | HttpRequestMessage
  | PongMessage
  | ErrorMessage
  | DomainsUpdatedMessage;

export type WebSocketMessage = ClientMessage | ServerMessage;
export type WebSocketMessageType = WebSocketMessage['type'];
