import { API_KEY_PREFIX, MAX_API_KEYS_PER_USER } from '@workslocal/shared';

import type { AuthResult } from '../auth.js';
import { createDb } from '../db/index.js';
import { createApiKey, listApiKeys, revokeApiKey, getUserApiKeyCount } from '../db/queries.js';
import type { Env } from '../types.js';
import { generateId } from '../utils/id.js';
import { success, error } from '../utils/response.js';

export async function handleCreateKey(
  request: Request,
  env: Env,
  auth: AuthResult,
): Promise<Response> {
  if (!auth.userId) {
    return error('AUTH_FAILED', 'Authentication required', 401);
  }

  const body = await request.json<{
    name?: string;
  }>();
  const name = body.name?.trim();
  if (!name || name.length > 100) {
    return error('VALIDATION_ERROR', 'Key name required (max 100 chars)', 400);
  }

  const db = createDb(env.DB);

  // Check limit
  const count = await getUserApiKeyCount(db, auth.userId);
  if (count >= MAX_API_KEYS_PER_USER) {
    return error(
      'MAX_TUNNELS_REACHED',
      `Maximum ${String(MAX_API_KEYS_PER_USER)} API keys allowed`,
      403,
    );
  }

  // Generate key
  const rawKey = `${API_KEY_PREFIX}${crypto.randomUUID().replace(/-/g, '')}`;
  const keyHash = await hashKey(rawKey);
  const prefix = rawKey.slice(0, 12);
  const id = generateId();

  await createApiKey(db, { id, userId: auth.userId, keyHash, prefix, name });

  // Return the raw key (shown once, never stored)
  return success(
    {
      id,
      key: rawKey,
      prefix,
      name,
      created_at: new Date().toISOString(),
    },
    201,
  );
}

export async function handleListKeys(env: Env, auth: AuthResult): Promise<Response> {
  if (!auth.userId) {
    return error('AUTH_FAILED', 'Authentication required', 401);
  }

  const db = createDb(env.DB);
  const keys = await listApiKeys(db, auth.userId);

  return success({
    keys: keys.map((k) => ({
      id: k.id,
      prefix: k.prefix,
      name: k.name,
      last_used_at: k.lastUsedAt,
      created_at: k.createdAt,
    })),
  });
}

export async function handleRevokeKey(
  keyId: string,
  env: Env,
  auth: AuthResult,
): Promise<Response> {
  if (!auth.userId) {
    return error('AUTH_FAILED', 'Authentication required', 401);
  }

  const db = createDb(env.DB);
  const revoked = await revokeApiKey(db, keyId, auth.userId);

  if (!revoked) {
    return error('NOT_FOUND', 'API key not found', 404);
  }

  return success({ revoked: true });
}

async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
