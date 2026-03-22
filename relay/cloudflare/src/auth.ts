import { AUTH_CACHE_TTL_SECONDS, API_KEY_PREFIX } from '@workslocal/shared';

import { createDb } from './db/index.js';
import { findApiKeyByHash, findUserById, createUserIfNotExists } from './db/queries.js';
import type { Env } from './types.js';

export interface AuthResult {
  authenticated: boolean;
  userId: string | null;
  email: string | null;
  error: string | null;
}

/**
 * Authenticate a request.
 *
 * Accepts two token types:
 * 1. Clerk JWT (Bearer eyJ...) - verified via JWKS
 * 2. API key (Bearer wl_k_...) - verified via SHA-256 hash → KV cache → D1
 *
 * Anonymous requests (no Authorization header) are allowed with limited access.
 */
export async function authenticateRequest(request: Request, env: Env): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');

  // No auth - anonymous access
  if (!authHeader) {
    return { authenticated: true, userId: null, email: null, error: null };
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return { authenticated: false, userId: null, email: null, error: 'Empty token' };
  }

  // API key (starts with wl_k_)
  if (token.startsWith(API_KEY_PREFIX)) {
    return authenticateApiKey(token, env);
  }

  // Clerk JWT (starts with eyJ)
  if (token.startsWith('eyJ')) {
    return authenticateClerkJwt(token, env);
  }

  return { authenticated: false, userId: null, email: null, error: 'Invalid token format' };
}

// ─── API Key Authentication ──────────────────────────────

async function authenticateApiKey(key: string, env: Env): Promise<AuthResult> {
  const keyHash = await hashApiKey(key);

  // Check KV cache
  const cached = await env.KV.get(`auth:${keyHash}`);
  if (cached) {
    const parsed = JSON.parse(cached) as { userId: string; email: string };
    return { authenticated: true, userId: parsed.userId, email: parsed.email, error: null };
  }

  // Cache miss - check D1
  const db = createDb(env.DB);
  const apiKey = await findApiKeyByHash(db, keyHash);

  if (!apiKey) {
    return { authenticated: false, userId: null, email: null, error: 'Invalid API key' };
  }

  // Get user email for display
  const user = await findUserById(db, apiKey.userId);

  // Cache in KV
  await env.KV.put(
    `auth:${keyHash}`,
    JSON.stringify({ userId: apiKey.userId, email: user?.email ?? '' }),
    { expirationTtl: Number(AUTH_CACHE_TTL_SECONDS) },
  );

  return { authenticated: true, userId: apiKey.userId, email: user?.email ?? null, error: null };
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Clerk JWT Authentication ────────────────────────────

interface ClerkJwtPayload {
  sub: string; // Clerk user ID
  email?: string;
  exp: number;
  iss: string;
  azp?: string;
}

let cachedJwks: JsonWebKeyWithKid[] | null = null;
let jwksFetchedAt = 0;
const JWKS_CACHE_MS = 60 * 60 * 1000; // 1 hour

async function authenticateClerkJwt(token: string, env: Env): Promise<AuthResult> {
  try {
    // Decode header to get kid
    const [headerB64] = token.split('.');
    if (!headerB64) throw new Error('Invalid JWT');
    const header = JSON.parse(atob(headerB64)) as { kid: string; alg: string };

    // Get JWKS (cached for 1 hour)
    const jwks = await getClerkJwks(env);
    const jwk = jwks.find((k) => k.kid === header.kid);
    if (!jwk) throw new Error('Unknown signing key');

    // Import the public key
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    // Verify signature
    const [, payloadB64, signatureB64] = token.split('.');
    if (!payloadB64 || !signatureB64) throw new Error('Invalid JWT structure');

    const signedContent = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlDecode(signatureB64);

    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signature,
      signedContent,
    );

    if (!valid) throw new Error('Invalid JWT signature');

    // Decode and validate payload
    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')),
    ) as ClerkJwtPayload;

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { authenticated: false, userId: null, email: null, error: 'Token expired' };
    }

    // Ensure/create user in D1
    const db = createDb(env.DB);
    await createUserIfNotExists(db, payload.sub, payload.email ?? '');

    return {
      authenticated: true,
      userId: payload.sub,
      email: payload.email ?? null,
      error: null,
    };
  } catch (err) {
    return {
      authenticated: false,
      userId: null,
      email: null,
      error: err instanceof Error ? err.message : 'JWT verification failed',
    };
  }
}

async function getClerkJwks(env: Env): Promise<JsonWebKeyWithKid[]> {
  if (cachedJwks && Date.now() - jwksFetchedAt < JWKS_CACHE_MS) {
    return cachedJwks;
  }

  // Clerk's JWKS endpoint derives from the publishable key
  // pk_test_xxx → https://verb-noun-00.clerk.accounts.dev/.well-known/jwks.json
  // pk_live_xxx → https://clerk.workslocal.dev/.well-known/jwks.json
  const pk = env.CLERK_PUBLISHABLE_KEY;
  const isLive = pk.startsWith('pk_live_');
  const jwksUrl = isLive
    ? 'https://clerk.workslocal.dev/.well-known/jwks.json'
    : `https://${extractClerkDomain(pk)}/.well-known/jwks.json`;

  const res = await fetch(jwksUrl);
  if (!res.ok) throw new Error(`Failed to fetch JWKS: ${String(res.status)}`);

  const data = await res.json<{ keys: JsonWebKeyWithKid[] }>();
  cachedJwks = data.keys;
  jwksFetchedAt = Date.now();
  return data.keys;
}

function extractClerkDomain(publishableKey: string): string {
  // pk_test_xxx is base64-encoded frontend API URL
  const encoded = publishableKey.replace('pk_test_', '').replace('pk_live_', '');
  const decoded = atob(encoded);
  // Returns something like "verb-noun-00.clerk.accounts.dev$"
  return decoded.replace(/\$$/, '');
}

function base64UrlDecode(str: string): ArrayBuffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
