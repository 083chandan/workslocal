/**
 * Cloudflare Worker environment bindings.
 * These match the bindings defined in wrangler.toml.
 */
export interface Env {
  // Durable Objects
  TUNNEL: DurableObjectNamespace;

  // D1 Database
  DB: D1Database;

  // KV Namespace
  KV: KVNamespace;

  // Environment variables (from [vars] in wrangler.toml)
  TUNNEL_DOMAINS: string;
  API_VERSION: string;
  ENVIRONMENT: string;

  // Secrets (set via `wrangler secret put`)
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
}
