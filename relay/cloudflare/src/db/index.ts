import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';

import * as schema from './schema.js';

/**
 * Create a Drizzle instance from a D1 binding.
 * Call this per-request - D1 bindings are request-scoped.
 */
export function createDb(d1: D1Database): DrizzleD1Database<typeof schema> & {
  $client: D1Database;
} {
  return drizzle(d1, { schema });
}

export type WorksLocalDb = ReturnType<typeof createDb>;
export { schema };
