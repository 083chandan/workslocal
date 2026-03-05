const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle CORS preflight requests.
 */
export function handleCors(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  return null;
}

/**
 * Add CORS headers to a response.
 */
export function withCors(response: Response): Response {
  const newResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    newResponse.headers.set(key, value);
  }
  return newResponse;
}
