import { createDb } from './db/index.js';
import { findApiKeyByHash } from './db/queries.js';
import type { Env } from './types.js';

interface AuthResult {
  authenticated: boolean;
  userId: string | null;
  error: string | null;
}

/**
 * Validate an API key from the Authorization header.
 *
 * Flow:
 * 1. Check KV cache (1hr TTL) — fast path
 * 2. Cache miss → hash key → query D1 → write KV cache
 * 3. Return userId or null
 *
 * Ship 1: Always returns { authenticated: true, userId: null }
 * Ship 2: Validates real API keys
 */
export async function authenticateRequest(request: Request, env: Env): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');

  // Ship 1: No auth required for anonymous tunnel creation
  if (!authHeader) {
    return { authenticated: true, userId: null, error: null };
  }

  // Ship 2: Validate Bearer token
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return { authenticated: false, userId: null, error: 'Missing token' };
  }

  // Hash the key
  const keyHash = await hashApiKey(token);

  // Check KV cache first
  const cached = await env.KV.get(`auth:${keyHash}`);
  if (cached) {
    const parsed = JSON.parse(cached) as { userId: string };
    return { authenticated: true, userId: parsed.userId, error: null };
  }

  // Cache miss — check D1
  const db = createDb(env.DB);
  const apiKey = await findApiKeyByHash(db, keyHash);

  if (!apiKey) {
    return { authenticated: false, userId: null, error: 'Invalid API key' };
  }

  // Cache in KV (1hr TTL)
  await env.KV.put(`auth:${keyHash}`, JSON.stringify({ userId: apiKey.userId }), {
    expirationTtl: 3600,
  });

  return { authenticated: true, userId: apiKey.userId, error: null };
}

/**
 * SHA-256 hash an API key.
 * Uses Web Crypto API (available in Workers).
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
