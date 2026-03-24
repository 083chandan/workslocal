/**
 * Integration test helpers for relay/cloudflare.
 *
 * SAFETY: Every URL in this file points to localhost:8787 (wrangler dev).
 * The assertDevServerRunning() guard verifies the server is up
 * before any test runs. If it's not reachable, tests abort.
 */
import http from 'node:http';

import { WebSocket } from 'ws';

// ──────────────────────────────────────────────────────────────
// SAFETY: All URLs point to localhost ONLY.
// If you change these, you are hitting production. Don't.
// ──────────────────────────────────────────────────────────────
export const BASE_URL = 'http://localhost:8787';
export const WS_URL = 'ws://localhost:8787/ws';

/**
 * Verify wrangler dev is running and reports a non-production environment.
 * Call in beforeAll — aborts ALL tests if the server isn't local.
 */
export async function assertDevServerRunning(): Promise<void> {
  try {
    const resp = await fetch(`${BASE_URL}/health`);
    if (!resp.ok) {
      throw new Error(`Health check returned ${String(resp.status)}`);
    }
    const body = await resp.json();
    const env = body.environment ?? body.env ?? '';

    if (env === 'production' || env === 'staging') {
      throw new Error(
        `\n\n🚨 SAFETY STOP: Server at ${BASE_URL} reports environment="${env}".\n` +
          `Tests MUST run against "development" environment.\n` +
          `You may be pointing at production. Aborting ALL tests.\n\n` +
          `Fix: Update wrangler.toml top-level [vars] ENVIRONMENT = "development"\n`,
      );
    }
  } catch (err) {
    if (
      err instanceof TypeError &&
      (err.message.includes('fetch') || err.message.includes('ECONNREFUSED'))
    ) {
      throw new Error(
        `\n\nDev server not running at ${BASE_URL}.\n` +
          `Start it: cd relay/cloudflare && pnpm dev\n`,
      );
    }
    throw err;
  }
}

/**
 * Open a WebSocket to the local dev server's /ws endpoint.
 */
export function connectWS(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error(`WebSocket connection to ${WS_URL} timed out (5s)`));
    }, 5000);

    ws.on('open', () => {
      clearTimeout(timeout);
      resolve(ws);
    });
    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/**
 * Send a JSON message over WS and wait for a response of a specific type.
 */
export function sendAndWaitFor(
  ws: WebSocket,
  message: Record<string, unknown>,
  waitForType: string,
  timeoutMs = 10_000,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.off('message', handler);
      reject(new Error(`Timed out waiting for "${waitForType}" (${String(timeoutMs)}ms)`));
    }, timeoutMs);

    const handler = (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as Record<string, unknown>;
        if (msg.type === waitForType) {
          clearTimeout(timeout);
          ws.off('message', handler);
          resolve(msg);
        }
      } catch {
        // Ignore non-JSON
      }
    };

    ws.on('message', handler);
    ws.send(JSON.stringify(message));
  });
}

/**
 * Create a tunnel via WS. Returns the open WS + tunnel metadata.
 */
export async function createTunnel(options: {
  name?: string;
  port?: number;
  anonymousToken?: string;
}): Promise<{
  ws: WebSocket;
  tunnelId: string;
  publicUrl: string;
  subdomain: string;
}> {
  const ws = await connectWS();

  const created = (await sendAndWaitFor(
    ws,
    {
      type: 'create_tunnel',
      local_port: options.port ?? 3000,
      custom_name: options.name,
      domain: 'workslocal.exposed',
      client_version: '0.2.0',
      anonymous_token: options.anonymousToken ?? `anon-${Date.now()}`,
    },
    'tunnel_created',
  )) as {
    tunnel_id: string;
    public_url: string;
    subdomain: string;
  };

  return {
    ws,
    tunnelId: created.tunnel_id,
    publicUrl: created.public_url,
    subdomain: created.subdomain,
  };
}

/**
 * Result from tunnelFetch — uses node:http because Node's fetch
 * silently drops the Host header (it's forbidden in the Fetch spec).
 */
export interface TunnelFetchResult {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

/**
 * Make an HTTP request to a tunnel through the local dev server.
 * Uses node:http (not fetch) so we can override the Host header,
 * which controls which tunnel subdomain receives the request.
 */
export function tunnelFetch(
  subdomain: string,
  path: string,
  opts: { method?: string; body?: string; headers?: Record<string, string> } = {},
): Promise<TunnelFetchResult> {
  const url = new URL(BASE_URL);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 8787,
        path,
        method: opts.method ?? 'GET',
        headers: {
          Host: `${subdomain}.workslocal.exposed`,
          ...opts.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => (data += chunk.toString()));
        res.on('end', () => resolve({ status: res.statusCode!, headers: res.headers, body: data }));
      },
    );
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

/**
 * Auto-respond to http_request messages on a tunnel WS.
 * Simulates a local server behind the tunnel.
 */
export function autoRespond(
  ws: WebSocket,
  statusCode = 200,
  responseBody = '{"ok":true}',
  responseHeaders: Record<string, string> = { 'content-type': 'application/json' },
): void {
  ws.on('message', (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString()) as Record<string, unknown>;
      if (msg.type === 'http_request') {
        ws.send(
          JSON.stringify({
            type: 'http_response',
            request_id: msg.request_id,
            status_code: statusCode,
            headers: responseHeaders,
            body: Buffer.from(responseBody).toString('base64'),
          }),
        );
      }
    } catch {
      // Ignore
    }
  });
}

/**
 * Close a WebSocket with timeout safety.
 */
export async function closeWS(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      resolve();
      return;
    }
    ws.on('close', () => resolve());
    ws.close();
    setTimeout(resolve, 2000);
  });
}

/**
 * Generate a unique subdomain per test to avoid collisions.
 */
export function uniqueSubdomain(prefix = 'test'): string {
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${rand}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
