import { checkRateLimit, RATE_LIMITS } from '../rate-limit.js';
import type { Env } from '../types.js';
import { error } from '../utils/response.js';

export async function routeToDO(
  request: Request,
  env: Env,
  subdomain: string,
  domain: string,
): Promise<Response> {
  const tunnelRate = RATE_LIMITS.tunnel(subdomain, domain);
  const tunnelResult = checkRateLimit(
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
  const ipResult = checkRateLimit(env, ipRate.scope, ipRate.limit, ipRate.windowSeconds);

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

export async function routeWebSocket(request: Request, env: Env): Promise<Response> {
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
