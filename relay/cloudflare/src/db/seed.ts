/**
 * Seed D1 with initial data.
 * Run via: wrangler d1 execute workslocal-db --local --file=src/db/seed.sql
 *
 * We use a SQL file instead of TypeScript because D1 seeding
 * doesn't have a runtime context — it's just SQL commands.
 */
