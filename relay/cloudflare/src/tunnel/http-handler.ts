import { MAX_PAYLOAD_BYTES } from '@workslocal/shared';

import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/encoding.js';

import type { TunnelContext, WireHttpResponse } from './types.js';
import { log } from './types.js';
import { handleUserWebSocket } from './ws-passthrough.js';

// ─── HTTP Request Forwarding ─────────────────────────────
export async function handleTunnelHttp(ctx: TunnelContext, request: Request): Promise<Response> {
  // Check if this is a WebSocket upgrade from a browser/external client
  const upgradeHeader = request.headers.get('Upgrade');
  if (upgradeHeader?.toLowerCase() === 'websocket') {
    return handleUserWebSocket(ctx, request);
  }

  const ws = ctx.getWebSocket();

  if (!ws) {
    return Response.json(
      {
        ok: false,
        error: { code: 'TUNNEL_NOT_CONNECTED', message: 'Tunnel client is not connected' },
      },
      { status: 502 },
    );
  }

  if (ws.readyState !== WebSocket.READY_STATE_OPEN) {
    return Response.json(
      {
        ok: false,
        error: { code: 'TUNNEL_NOT_CONNECTED', message: 'Tunnel client WebSocket is not open' },
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
          error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds 10MB limit' },
        },
        { status: 413 },
      );
    }
    if (bodyBytes.byteLength > 0) {
      bodyBase64 = uint8ArrayToBase64(new Uint8Array(bodyBytes));
    }
  }

  // Extract headers (skip internal/hop-by-hop)
  // NOTE: accept-encoding is stripped so localhost always responds uncompressed.
  // Cloudflare re-compresses at the edge for the browser — zero perf cost.
  const headers: Record<string, string> = {};
  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase();
    if (
      lower === 'host' ||
      lower === 'connection' ||
      lower === 'upgrade' ||
      lower === 'accept-encoding' ||
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

  const httpRequestMsg = JSON.stringify({
    type: 'http_request',
    request_id: requestId,
    method: request.method,
    path: url.pathname,
    headers,
    body: bodyBase64,
    query,
  });

  return new Promise<Response>((resolve) => {
    const timer = setTimeout(() => {
      ctx.pendingRequests.delete(requestId);
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

    ctx.pendingRequests.set(requestId, {
      resolve,
      timer,
      createdAt: Date.now(),
    });

    try {
      ws.send(httpRequestMsg);
    } catch {
      clearTimeout(timer);
      ctx.pendingRequests.delete(requestId);
      resolve(
        Response.json(
          {
            ok: false,
            error: { code: 'WS_SEND_FAILED', message: 'Failed to send request to tunnel client' },
          },
          { status: 502 },
        ),
      );
    }
  });
}

// ─── HTTP Response from Client ───────────────────────────
export function handleHttpResponse(ctx: TunnelContext, msg: WireHttpResponse): void {
  const pending = ctx.pendingRequests.get(msg.request_id);
  if (!pending) {
    log.warn('No pending request', { requestId: msg.request_id });
    return;
  }

  clearTimeout(pending.timer);
  ctx.pendingRequests.delete(msg.request_id);

  let bodyBytes: Uint8Array | null = null;
  if (msg.body) {
    try {
      bodyBytes = base64ToUint8Array(msg.body);
    } catch {
      log.warn('Failed to decode base64 body', { requestId: msg.request_id });
    }
  }

  const headers = new Headers(msg.headers);
  headers.delete('transfer-encoding');
  headers.delete('connection');
  headers.delete('keep-alive');
  // Strip content-encoding — localhost should never compress (we stripped
  // accept-encoding on the way in), but if it does, the binary body will
  // have been corrupted through the JSON text transport. Removing the header
  // ensures the browser treats the body as-is rather than trying to decompress.
  // Cloudflare will re-compress the response at the edge anyway.
  headers.delete('content-encoding');
  headers.set('X-Tunnel-Response', 'true');

  pending.resolve(
    new Response(bodyBytes, {
      status: msg.status_code,
      headers,
    }),
  );
}
