export type TunnelStatus = 'active' | 'inactive' | 'connecting' | 'error';

export interface Tunnel {
  readonly id: string;
  readonly userId: string | null;
  readonly subdomain: string;
  readonly domain: string;
  readonly localPort: number;
  readonly localHost: string;
  readonly isActive: boolean;
  readonly isAnonymous: boolean;
  readonly anonymousToken: string | null;
  readonly createdAt: Date;
  readonly expiresAt: Date | null;
}

export interface TunnelConfig {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly port: number;
  readonly subdomain: string | null;
  readonly domain: string;
  readonly localHost: string;
  readonly headers: Record<string, string> | null;
}

export interface TunnelDomain {
  readonly id: string;
  readonly domain: string;
  readonly isActive: boolean;
  readonly addedAt: Date;
}

export interface CreateTunnelRequest {
  readonly port: number;
  readonly subdomain?: string;
  readonly domain?: string;
  readonly localHost?: string;
}

export interface CreateTunnelResponse {
  readonly tunnelId: string;
  readonly publicUrl: string;
  readonly subdomain: string;
  readonly domain: string;
  readonly status: TunnelStatus;
}
