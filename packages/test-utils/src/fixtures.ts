/** Builds a minimal HttpRequestMessage for testing proxy forwarding */
export function makeHttpRequest(
  overrides: Partial<{
    requestId: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    body: string;
    query: Record<string, string>;
  }> = {},
): {
  type: 'http_request';
  request_id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string;
  query: Record<string, string>;
} {
  return {
    type: 'http_request' as const,
    request_id: overrides.requestId ?? `req-${Date.now()}`,
    method: overrides.method ?? 'GET',
    path: overrides.path ?? '/api/test',
    headers: overrides.headers ?? { 'content-type': 'application/json' },
    body: overrides.body ?? '',
    query: overrides.query ?? {},
  };
}

/** Builds a tunnel_created server message for testing client responses */
export function makeTunnelCreated(
  overrides: Partial<{
    tunnelId: string;
    subdomain: string;
    domain: string;
  }> = {},
): {
  type: 'tunnel_created';
  tunnel_id: string;
  public_url: string;
  subdomain: string;
  domain: string;
  expires_at: string;
} {
  return {
    type: 'tunnel_created' as const,
    tunnel_id: overrides.tunnelId ?? 'tun-test-123',
    public_url: `https://${overrides.subdomain ?? 'testapp'}.${overrides.domain ?? 'workslocal.exposed'}`,
    subdomain: overrides.subdomain ?? 'testapp',
    domain: overrides.domain ?? 'workslocal.exposed',
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  };
}
