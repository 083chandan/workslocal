import { base64ToUint8Array, uint8ArrayToBase64 } from '../utils/encoding.js';

import type { TunnelContext, WireWsClose, WireWsFrame } from './types.js';
import { log } from './types.js';

/**
 * Handle a WebSocket upgrade from an external client (browser).
 * Accept the WS, assign a request_id, and tell the CLI to open
 * a matching local WS connection via ws_open message.
 */
export function handleUserWebSocket(ctx: TunnelContext, request: Request): Response {
  const tunnelWs = ctx.getWebSocket();

  if (!tunnelWs) {
    return Response.json(
      {
        ok: false,
        error: { code: 'TUNNEL_NOT_CONNECTED', message: 'Tunnel client is not connected' },
      },
      { status: 502 },
    );
  }

  if (tunnelWs.readyState !== WebSocket.READY_STATE_OPEN) {
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

  // Accept the browser's WebSocket
  const pair = new WebSocketPair();
  const [client, server] = [pair[0], pair[1]];

  // Store the server-side socket keyed by request_id
  ctx.userSockets.set(requestId, server);

  // Extract headers (skip hop-by-hop and internal)
  const headers: Record<string, string> = {};
  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase();
    if (
      lower === 'host' ||
      lower === 'connection' ||
      lower === 'upgrade' ||
      lower === 'sec-websocket-key' ||
      lower === 'sec-websocket-version' ||
      lower === 'sec-websocket-extensions' ||
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

  const protocol = request.headers.get('Sec-WebSocket-Protocol') ?? '';

  // Tell CLI to open a local WebSocket
  tunnelWs.send(
    JSON.stringify({
      type: 'ws_open',
      request_id: requestId,
      path: url.pathname,
      headers,
      query,
      protocol,
    }),
  );

  log.info('User WebSocket opened', {
    requestId,
    path: url.pathname,
    connectionId: ctx.connectionId ?? 'unknown',
  });

  // Listen for frames from the browser → relay to CLI
  server.accept();

  server.addEventListener('message', (event: MessageEvent) => {
    const data: unknown = event.data;
    let base64Data: string;
    let isBinary: boolean;

    if (typeof data === 'string') {
      // Text frame: base64-encode the UTF-8 string
      const encoder = new TextEncoder();
      base64Data = uint8ArrayToBase64(encoder.encode(data));
      isBinary = false;
    } else if (data instanceof ArrayBuffer) {
      base64Data = uint8ArrayToBase64(new Uint8Array(data));
      isBinary = true;
    } else {
      return;
    }

    // Forward to CLI via tunnel WS
    try {
      tunnelWs.send(
        JSON.stringify({
          type: 'ws_frame',
          request_id: requestId,
          data: base64Data,
          is_binary: isBinary,
        }),
      );
    } catch {
      log.warn('Failed to forward user WS frame to tunnel', { requestId });
    }
  });

  server.addEventListener('close', (event: CloseEvent) => {
    ctx.userSockets.delete(requestId);

    log.info('User WebSocket closed', {
      requestId,
      code: String(event.code),
    });

    // Tell CLI the browser WS closed
    try {
      tunnelWs.send(
        JSON.stringify({
          type: 'ws_close',
          request_id: requestId,
          code: event.code,
          reason: event.reason || 'Browser closed connection',
        }),
      );
    } catch {
      // Tunnel WS may be closed already
    }
  });

  server.addEventListener('error', () => {
    ctx.userSockets.delete(requestId);

    try {
      tunnelWs.send(
        JSON.stringify({
          type: 'ws_close',
          request_id: requestId,
          code: 1011,
          reason: 'WebSocket error',
        }),
      );
    } catch {
      // Tunnel WS may be closed already
    }
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

/**
 * Forward a WS frame from CLI (localhost) back to the browser.
 */
export function handleWsFrame(ctx: TunnelContext, msg: WireWsFrame): void {
  const userSocket = ctx.userSockets.get(msg.request_id);
  if (!userSocket) return;

  try {
    if (msg.is_binary) {
      userSocket.send(base64ToUint8Array(msg.data));
    } else {
      userSocket.send(atob(msg.data));
    }
  } catch {
    log.warn('Failed to send WS frame to browser', { requestId: msg.request_id });
  }
}

/**
 * Close a user WebSocket (CLI told us the local WS closed).
 */
export function handleWsClose(ctx: TunnelContext, msg: WireWsClose): void {
  const userSocket = ctx.userSockets.get(msg.request_id);
  if (!userSocket) return;

  try {
    userSocket.close(msg.code, msg.reason);
  } catch {
    // Already closed
  }
  ctx.userSockets.delete(msg.request_id);

  log.info('User WebSocket closed by CLI', {
    requestId: msg.request_id,
    code: String(msg.code),
  });
}
