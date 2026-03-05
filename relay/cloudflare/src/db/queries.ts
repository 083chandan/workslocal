import { eq, and, lt } from 'drizzle-orm';

import { generateId } from '../utils/id.js';

import { tunnels, tunnelDomains, users, apiKeys } from './schema.js';

import type { WorksLocalDb } from './index.js';

// ─── Tunnel Domains ────────────────────────────────────

export async function getActiveDomains(db: WorksLocalDb): Promise<string[]> {
  const rows = await db
    .select({ domain: tunnelDomains.domain })
    .from(tunnelDomains)
    .where(eq(tunnelDomains.isActive, true));
  return rows.map((r) => r.domain);
}

// ─── Tunnels (for authenticated users — Ship 2) ────────

export async function findTunnelBySubdomain(
  db: WorksLocalDb,
  subdomain: string,
  domain: string,
): Promise<
  | {
      id: string;
      userId: string | null;
      subdomain: string;
      domain: string;
      reserved: boolean;
      lastActivity: string | null;
      createdAt: string;
    }
  | undefined
> {
  return db
    .select()
    .from(tunnels)
    .where(and(eq(tunnels.subdomain, subdomain), eq(tunnels.domain, domain)))
    .get();
}

export async function reserveSubdomain(
  db: WorksLocalDb,
  userId: string,
  subdomain: string,
  domain: string,
): Promise<{
  id: string;
  domain: string;
  createdAt: string;
  userId: string | null;
  subdomain: string;
  reserved: boolean;
  lastActivity: string | null;
}> {
  const id = generateId();
  return db
    .insert(tunnels)
    .values({
      id,
      userId,
      subdomain,
      domain,
      reserved: true,
    })
    .onConflictDoUpdate({
      target: [tunnels.subdomain, tunnels.domain],
      set: { userId, reserved: true, lastActivity: new Date().toISOString() },
    })
    .returning()
    .get();
}

export async function getUserTunnelCount(db: WorksLocalDb, userId: string): Promise<number> {
  const rows = await db
    .select()
    .from(tunnels)
    .where(and(eq(tunnels.userId, userId), eq(tunnels.reserved, true)));
  return rows.length;
}

export async function cleanupStaleTunnels(db: WorksLocalDb, staleDaysAgo: number): Promise<number> {
  const cutoff = new Date(Date.now() - staleDaysAgo * 24 * 60 * 60 * 1000).toISOString();
  const result = await db
    .delete(tunnels)
    .where(and(eq(tunnels.reserved, true), lt(tunnels.lastActivity, cutoff)));
  return (result as { meta?: { changes?: number } }).meta?.changes ?? 0;
}

// ─── Users (Ship 2) ────────────────────────────────────

export async function findUserById(
  db: WorksLocalDb,
  id: string,
): Promise<
  | {
      id: string;
      email: string;
      defaultDomain: string;
      createdAt: string;
    }
  | undefined
> {
  return db.select().from(users).where(eq(users.id, id)).get();
}

// ─── API Keys (Ship 2) ─────────────────────────────────

export async function findApiKeyByHash(
  db: WorksLocalDb,
  keyHash: string,
): Promise<
  | {
      id: string;
      userId: string;
      keyHash: string;
      prefix: string;
      name: string;
      lastUsedAt: string | null;
      revokedAt: string | null;
      createdAt: string;
    }
  | undefined
> {
  return db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.keyHash, keyHash),
        eq(apiKeys.revokedAt, null as unknown as string), // Not revoked
      ),
    )
    .get();
}
