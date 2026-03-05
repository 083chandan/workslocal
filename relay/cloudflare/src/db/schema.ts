import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ─── Users ─────────────────────────────────────────────
// Created when user authenticates via Clerk (Ship 2)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull(),
  defaultDomain: text('default_domain').notNull().default('workslocal.exposed'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── API Keys ──────────────────────────────────────────
// SHA-256 hashed. Only prefix visible.
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(), // cuid
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  keyHash: text('key_hash').notNull(), // SHA-256 hash
  prefix: text('prefix').notNull(), // First 8 chars for identification
  name: text('name').notNull(), // User-friendly name
  lastUsedAt: text('last_used_at'),
  revokedAt: text('revoked_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Tunnels ───────────────────────────────────────────
// One row per persistent subdomain (authenticated users)
// Anonymous tunnels do NOT get D1 rows — they live in DO state only
export const tunnels = sqliteTable(
  'tunnels',
  {
    id: text('id').primaryKey(), // cuid
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    subdomain: text('subdomain').notNull(),
    domain: text('domain').notNull().default('workslocal.exposed'),
    reserved: integer('reserved', { mode: 'boolean' }).notNull().default(true),
    lastActivity: text('last_activity').default(sql`(datetime('now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [uniqueIndex('tunnels_subdomain_domain_idx').on(table.subdomain, table.domain)],
);

// ─── Tunnel Domains ────────────────────────────────────
// Registry of available tunnel domains (admin-managed)
export const tunnelDomains = sqliteTable('tunnel_domains', {
  id: text('id').primaryKey(),
  domain: text('domain').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  addedAt: text('added_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Tunnel Configs ────────────────────────────────────
// Saved presets (Ship 2+)
export const tunnelConfigs = sqliteTable('tunnel_configs', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  port: integer('port').notNull(),
  subdomain: text('subdomain'),
  domain: text('domain').notNull().default('workslocal.exposed'),
  localHost: text('local_host').notNull().default('localhost'),
  headers: text('headers', { mode: 'json' }), // JSON Record<string, string>
});
