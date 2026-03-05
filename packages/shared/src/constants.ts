/**
 * WorksLocal constants — single source of truth.
 */

export const TUNNEL_DOMAINS = ['workslocal.exposed', 'workslocal.io', 'workslocal.run'] as const;

export type TunnelDomainName = (typeof TUNNEL_DOMAINS)[number];

export const DEFAULT_TUNNEL_DOMAIN: TunnelDomainName = 'workslocal.exposed';

export const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'app',
  'admin',
  'mail',
  'smtp',
  'ftp',
  'ssh',
  'ns1',
  'ns2',
  'cdn',
  'static',
  'assets',
  'docs',
  'portal',
  'dashboard',
  'status',
  'health',
  'metrics',
  'staging',
  'test',
  'dev',
  'demo',
  'help',
  'support',
  'blog',
] as const;

export const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$/;

export const MAX_TUNNELS_PER_USER = 5;
export const MAX_API_KEYS_PER_USER = 5;
export const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024;
export const HEARTBEAT_INTERVAL_MS = 30_000;
export const STALE_THRESHOLD_DAYS = 7;
export const SUBDOMAIN_RESERVATION_MS = 5 * 60 * 1000;
export const MAX_REQUESTS_PER_TUNNEL = 1000;
export const API_KEY_PREFIX = 'ot_k_';
export const API_VERSION = 'v1';
export const ANONYMOUS_TUNNEL_TTL_MS = 2 * 60 * 60 * 1000; // Anonymous tunnel time-to-live: 2 hours
