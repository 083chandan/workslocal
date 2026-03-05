interface ApiSuccessData {
  [key: string]: unknown;
}

/**
 * Standard success response.
 */
export function success(data: ApiSuccessData, status = 200): Response {
  return Response.json({ ok: true, data }, { status });
}

/**
 * Standard error response.
 */
export function error(code: string, message: string, status = 400): Response {
  return Response.json({ ok: false, error: { code, message } }, { status });
}

/**
 * Response headers added to every response.
 */
export function withStandardHeaders(response: Response, apiVersion: string): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('X-API-Version', apiVersion);
  newResponse.headers.set('X-Powered-By', 'WorksLocal');
  return newResponse;
}
