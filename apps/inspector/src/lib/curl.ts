import type { CapturedRequest } from '../types';

import { decodeBody } from './format';

/**
 * Generate a cURL command from a captured request.
 */
export function generateCurl(req: CapturedRequest, tunnelUrl: string): string {
  const parts: string[] = ['curl'];

  // Method (skip for GET - it's the default)
  if (req.method !== 'GET') {
    parts.push(`-X ${req.method}`);
  }

  // URL
  const queryString = Object.entries(req.query)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const fullUrl = queryString
    ? `${tunnelUrl}${req.path}?${queryString}`
    : `${tunnelUrl}${req.path}`;
  parts.push(`'${fullUrl}'`);

  // Headers (skip internal ones)
  for (const [key, value] of Object.entries(req.requestHeaders)) {
    const lower = key.toLowerCase();
    if (lower === 'host' || lower === 'content-length' || lower === 'connection') continue;
    parts.push(`-H '${key}: ${value}'`);
  }

  // Body
  const body = decodeBody(req.requestBody);
  if (body) {
    // Escape single quotes in body
    const escaped = body.replace(/'/g, "'\\''");
    parts.push(`-d '${escaped}'`);
  }

  return parts.join(' \\\n  ');
}
