import { STALE_THRESHOLD_DAYS } from '@workslocal/shared';

import { authenticateRequest } from './auth.js';
import { createDb } from './db/index.js';
import { getActiveDomains, cleanupStaleTunnels } from './db/queries.js';
import { checkRateLimit, RATE_LIMITS } from './rate-limit.js';
import { handleCreateKey, handleListKeys, handleRevokeKey } from './routes/keys.js';
import type { Env } from './types.js';
import { handleCors, withCors } from './utils/cors.js';
import { parseTunnelHost } from './utils/host.js';
import { createWorkerLogger } from './utils/logger.js';
import { success, error, withStandardHeaders } from './utils/response.js';

const log = createWorkerLogger('worker');

export { TunnelDO } from './tunnel.js';

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;

    const url = new URL(request.url);
    const host = request.headers.get('Host') ?? '';
    const tunnelDomains = env.TUNNEL_DOMAINS.split(',').map((d) => d.trim());

    let response: Response;

    try {
      const tunnel = parseTunnelHost(host, tunnelDomains);

      if (tunnel) {
        response = await routeToDO(request, env, tunnel.subdomain, tunnel.domain);
      } else if (url.pathname === '/health') {
        response = handleHealth();
      } else if (url.pathname === '/health/ready') {
        response = await handleHealthReady(env);
      } else if (url.pathname === '/ws') {
        response = await routeWebSocket(request, env);
      } else if (url.pathname === '/auth/login') {
        response = handleAuthLoginPage(url, env);
      } else if (url.pathname === '/auth/callback') {
        response = handleAuthCallback(url, env);
      } else if (url.pathname === '/api/v1/account' && request.method === 'GET') {
        const auth = await authenticateRequest(request, env);
        if (!auth.authenticated || !auth.userId) {
          response = error('AUTH_FAILED', auth.error ?? 'Authentication required', 401);
        } else {
          response = success({ id: auth.userId, email: auth.email });
        }
      } else if (url.pathname === '/api/v1/keys' && request.method === 'POST') {
        const auth = await authenticateRequest(request, env);
        response = await handleCreateKey(request, env, auth);
      } else if (url.pathname === '/api/v1/keys' && request.method === 'GET') {
        const auth = await authenticateRequest(request, env);
        response = await handleListKeys(env, auth);
      } else if (url.pathname.startsWith('/api/v1/keys/') && request.method === 'DELETE') {
        const keyId = url.pathname.split('/').pop() ?? '';
        const auth = await authenticateRequest(request, env);
        response = await handleRevokeKey(keyId, env, auth);
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

    response = withStandardHeaders(response, env.API_VERSION);
    response = withCors(response);

    return response;
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    log.info('Stale tunnel cleanup started');

    try {
      const db = createDb(env.DB);
      const startTime = Date.now();
      const removed = await cleanupStaleTunnels(db, Number(STALE_THRESHOLD_DAYS));
      const durationMs = Date.now() - startTime;

      log.info('Stale tunnel cleanup complete', {
        removed: String(removed),
        durationMs: String(durationMs),
      });
    } catch (err) {
      log.error('Stale tunnel cleanup failed', {
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

    const domains = await getActiveDomains(db);
    const dbOk = domains.length > 0;

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

async function routeToDO(
  request: Request,
  env: Env,
  subdomain: string,
  domain: string,
): Promise<Response> {
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

  const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const ipRate = RATE_LIMITS.anonymousIp(clientIp);
  const ipResult = await checkRateLimit(env, ipRate.scope, ipRate.limit, ipRate.windowSeconds);

  if (!ipResult.allowed) {
    return error('RATE_LIMITED', 'IP rate limit exceeded (200 requests/minute)', 429);
  }

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

async function routeWebSocket(request: Request, env: Env): Promise<Response> {
  const upgradeHeader = request.headers.get('Upgrade');
  if (upgradeHeader?.toLowerCase() !== 'websocket') {
    return error('BAD_REQUEST', 'Expected WebSocket upgrade', 400);
  }

  const connectionId = crypto.randomUUID();

  const doId = env.TUNNEL.idFromName(`conn:${connectionId}`);
  const doStub = env.TUNNEL.get(doId);

  const doRequest = new Request(request.url, request);
  doRequest.headers.set('X-Connection-Id', connectionId);

  return doStub.fetch(doRequest);
}

// ─── Auth Pages ──────────────────────────────────────────

/**
 * /auth/login - loads Clerk JS, redirects to hosted sign-in.
 *
 * Flow:
 * 1. CLI opens browser → /auth/login?callback=...&state=...
 * 2. Clerk.load() → if already signed in → grab token+email → redirect to CLI
 * 3. If not signed in → redirectToSignIn() → Clerk hosted UI
 * 4. After sign-in → Clerk redirects to /auth/callback
 */
function handleAuthLoginPage(url: URL, env: Env): Response {
  const callback = url.searchParams.get('callback') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const pk = env.CLERK_PUBLISHABLE_KEY;

  const afterSignInUrl = `https://api.workslocal.dev/auth/callback?callback=${encodeURIComponent(callback)}&state=${state}`;

  const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>WorksLocal - Sign In</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui; background: #0a0a0a; color: #fff; display: flex;
           justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    #app { width: 400px; text-align: center; }
    h1 { font-size: 1.5rem; margin-bottom: 2rem; }
    .loading { color: #888; }
    .error { color: #ef4444; margin-top: 1rem; display: none; }
  </style>
</head><body>
  <div id="app">
    <h1>WorksLocal</h1>
    <p class="loading" id="loading">Redirecting to sign-in...</p>
    <p class="error" id="error"></p>
  </div>
  <script
    async
    crossorigin="anonymous"
    data-clerk-publishable-key="${pk}"
    src="https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"
    type="text/javascript"
  ></script>
  <script>
    var CALLBACK = decodeURIComponent('${encodeURIComponent(callback)}');
    var STATE = '${state}';
    var AFTER_SIGN_IN = '${afterSignInUrl}';

    window.addEventListener('load', async function() {
      try {
        await window.Clerk.load();

        if (window.Clerk.user) {
          var token = await window.Clerk.session.getToken();
          var email = window.Clerk.user.primaryEmailAddress
            ? window.Clerk.user.primaryEmailAddress.emailAddress
            : '';
          window.location.href = CALLBACK
            + '?token=' + encodeURIComponent(token)
            + '&state=' + STATE
            + '&email=' + encodeURIComponent(email);
          return;
        }

        window.Clerk.redirectToSignIn({
          afterSignInUrl: AFTER_SIGN_IN,
        });
      } catch (err) {
        document.getElementById('loading').style.display = 'none';
        var errorEl = document.getElementById('error');
        errorEl.style.display = 'block';
        errorEl.textContent = 'Error: ' + err.message;
      }
    });
  </script>
</body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

/**
 * /auth/callback - receives redirect from Clerk after sign-in.
 * Grabs session token + email → redirects to CLI's local callback.
 */
function handleAuthCallback(url: URL, env: Env): Response {
  const callback = url.searchParams.get('callback') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const pk = env.CLERK_PUBLISHABLE_KEY;

  const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>WorksLocal - Completing sign-in...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui; background: #0a0a0a; color: #fff; display: flex;
           justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    #app { text-align: center; }
    .loading { color: #888; }
    .error { color: #ef4444; margin-top: 1rem; display: none; }
  </style>
</head><body>
  <div id="app">
    <p class="loading" id="loading">Completing sign-in...</p>
    <p class="error" id="error"></p>
  </div>
  <script
    async
    crossorigin="anonymous"
    data-clerk-publishable-key="${pk}"
    src="https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"
    type="text/javascript"
  ></script>
  <script>
    var CALLBACK = decodeURIComponent('${encodeURIComponent(callback)}');
    var STATE = '${state}';

    window.addEventListener('load', async function() {
      try {
        await window.Clerk.load();

        if (window.Clerk.user) {
          var token = await window.Clerk.session.getToken();
          var email = window.Clerk.user.primaryEmailAddress
            ? window.Clerk.user.primaryEmailAddress.emailAddress
            : '';
          window.location.href = CALLBACK
            + '?token=' + encodeURIComponent(token)
            + '&state=' + STATE
            + '&email=' + encodeURIComponent(email);
          return;
        }

        document.getElementById('loading').style.display = 'none';
        var errorEl = document.getElementById('error');
        errorEl.style.display = 'block';
        errorEl.textContent = 'Sign-in was not completed. Please close this tab and try "workslocal login" again.';
      } catch (err) {
        document.getElementById('loading').style.display = 'none';
        var errorEl = document.getElementById('error');
        errorEl.style.display = 'block';
        errorEl.textContent = 'Error: ' + err.message;
      }
    });
  </script>
</body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
