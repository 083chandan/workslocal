import { STALE_THRESHOLD_DAYS } from '@workslocal/shared';

import { createDb } from './db/index.js';
import { getActiveDomains } from './db/queries.js';
import { cleanupStaleTunnels } from './db/queries.js';
import { checkRateLimit, RATE_LIMITS } from './rate-limit.js';
import type { Env } from './types.js';
import { handleCors, withCors } from './utils/cors.js';
import { parseTunnelHost } from './utils/host.js';
import { createWorkerLogger } from './utils/logger.js';
import { success, error, withStandardHeaders } from './utils/response.js';

const log = createWorkerLogger('worker');

export { TunnelDO } from './tunnel.js';

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    // CORS preflight
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;

    const url = new URL(request.url);
    const host = request.headers.get('Host') ?? '';
    const tunnelDomains = env.TUNNEL_DOMAINS.split(',').map((d) => d.trim());

    let response: Response;

    try {
      // ─── Check if this is tunnel traffic ──────────────
      const tunnel = parseTunnelHost(host, tunnelDomains);

      if (tunnel) {
        // Route to Durable Object by subdomain
        response = await routeToDO(request, env, tunnel.subdomain, tunnel.domain);
      } else if (url.pathname === '/health') {
        response = handleHealth();
      } else if (url.pathname === '/health/ready') {
        response = await handleHealthReady(env);
      } else if (url.pathname === '/ws') {
        // WebSocket connection — route to DO
        // Client sends subdomain in create_tunnel message after connecting
        // For now, use a temporary DO until tunnel is created
        response = await routeWebSocket(request, env);
      } else if (url.pathname.startsWith('/api/v1/')) {
        // API routes (Step 5+)
        response = error('NOT_IMPLEMENTED', 'API routes coming in Ship 2', 501);
      } else {
        response = error('NOT_FOUND', `Route not found: ${url.pathname}`, 404);
      }
    } catch (err) {
      log.error('Worker fetch error', { err: err instanceof Error ? err.message : String(err) });
      response = error(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Internal server error',
        500,
      );
    }

    // Add standard headers and CORS
    response = withStandardHeaders(response, env.API_VERSION);
    response = withCors(response);

    return response;
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const startTime = Date.now();
    log.info('[cron] Stale tunnel cleanup started', { startTime });

    try {
      const db = createDb(env.DB);
      const removed = await cleanupStaleTunnels(db, STALE_THRESHOLD_DAYS);
      const durationMs = Date.now() - startTime;

      log.info('[cron] Stale tunnel cleanup complete', { removed, durationMs });
    } catch (err) {
      log.error('[cron] Stale tunnel cleanup failed', {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  },
};

// ─── Health ──────────────────────────────────────────────

function handleHealth(): Response {
  return success({ status: 'ok' });
}

async function handleHealthReady(env: Env): Promise<Response> {
  try {
    const db = createDb(env.DB);

    // Test D1 via Drizzle
    const domains = await getActiveDomains(db);
    const dbOk = domains.length > 0;

    // Test KV
    const kvTestKey = '__health_check__';
    await env.KV.put(kvTestKey, 'ok', { expirationTtl: 60 });
    const kvValue = await env.KV.get(kvTestKey);
    const kvOk = kvValue === 'ok';

    const ready = dbOk && kvOk;

    return success({
      status: ready ? 'ready' : 'not_ready',
      db: dbOk ? 'ok' : 'error',
      kv: kvOk ? 'ok' : 'error',
      domains,
    });
  } catch (err) {
    return success({
      status: 'not_ready',
      db: 'error',
      kv: 'error',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ─── Durable Object Routing ─────────────────────────────

/**
 * Route tunnel HTTP traffic to the correct Durable Object.
 * Looks up KV to find which connection DO handles this subdomain.
 */
async function routeToDO(
  request: Request,
  env: Env,
  subdomain: string,
  domain: string,
): Promise<Response> {
  // Rate limit: per-tunnel
  const tunnelRate = RATE_LIMITS.tunnel(subdomain, domain);
  const tunnelResult = await checkRateLimit(
    env,
    tunnelRate.scope,
    tunnelRate.limit,
    tunnelRate.windowSeconds,
  );

  if (!tunnelResult.allowed) {
    return error('RATE_LIMITED', 'Tunnel rate limit exceeded (1,000 requests/hour)', 429);
  }

  // Rate limit: per-IP (anonymous)
  const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const ipRate = RATE_LIMITS.anonymousIp(clientIp);
  const ipResult = await checkRateLimit(env, ipRate.scope, ipRate.limit, ipRate.windowSeconds);

  if (!ipResult.allowed) {
    return error('RATE_LIMITED', 'IP rate limit exceeded (200 requests/minute)', 429);
  }

  // KV lookup for tunnel
  const kvKey = `tunnel:${domain}:${subdomain}`;
  const connectionName = await env.KV.get(kvKey);

  if (!connectionName) {
    return error(
      'TUNNEL_NOT_FOUND',
      `Tunnel ${subdomain}.${domain} is not active. Create one: npx workslocal http <port> --name ${subdomain}`,
      404,
    );
  }

  const doId = env.TUNNEL.idFromName(connectionName);
  const doStub = env.TUNNEL.get(doId);

  const doRequest = new Request(request.url, request);
  doRequest.headers.set('X-Tunnel-Subdomain', subdomain);
  doRequest.headers.set('X-Tunnel-Domain', domain);
  doRequest.headers.set('X-Tunnel-Request-Type', 'http');

  return doStub.fetch(doRequest);
}

/**
 * Route WebSocket connections to a Durable Object.
 *
 * The WebSocket connection doesn't know which subdomain it wants yet —
 * the client sends create_tunnel after connecting. So we route to a
 * "connection manager" DO that handles the initial WebSocket and
 * tunnel creation.
 *
 * Architecture: Each WS connection gets its own DO instance (keyed by
 * a random connection ID). When the client sends create_tunnel, the DO
 * registers the subdomain mapping. Tunnel HTTP traffic is routed to
 * a separate DO keyed by subdomain.
 *
 * SIMPLIFICATION FOR SHIP 1: Since we only support one tunnel per CLI
 * session, we can route the WS to the subdomain's DO directly — but
 * we don't know the subdomain yet. Two options:
 *
 * Option A: Client sends subdomain as query param: /ws?name=myapp
 * Option B: Client connects to a random DO, sends create_tunnel,
 *           and the DO handles everything internally.
 *
 * We go with Option B — it matches the existing protocol. The client
 * connects, sends create_tunnel, and gets back tunnel_created.
 * The DO internally registers itself for the subdomain.
 */
async function routeWebSocket(request: Request, env: Env): Promise<Response> {
  // Verify this is a WebSocket upgrade request
  const upgradeHeader = request.headers.get('Upgrade');
  if (upgradeHeader?.toLowerCase() !== 'websocket') {
    return error('BAD_REQUEST', 'Expected WebSocket upgrade', 400);
  }

  // Generate a unique connection ID for this WS session
  const connectionId = crypto.randomUUID();

  // Route to a DO keyed by connection ID
  // This DO will handle the WS lifecycle and register subdomain mapping
  const doId = env.TUNNEL.idFromName(`conn:${connectionId}`);
  const doStub = env.TUNNEL.get(doId);

  // Pass connection ID to the DO
  const doRequest = new Request(request.url, request);
  doRequest.headers.set('X-Connection-Id', connectionId);

  return doStub.fetch(doRequest);
}
