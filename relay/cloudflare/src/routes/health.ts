import { createDb } from '../db/index.js';
import { getActiveDomains } from '../db/queries.js';
import type { Env } from '../types.js';
import { success } from '../utils/response.js';

export function handleHealth(): Response {
  return success({ status: 'ok' });
}

export async function handleHealthReady(_request: Request, env: Env): Promise<Response> {
  try {
    const db = createDb(env.DB);

    const domains = await getActiveDomains(db);
    const dbOk = domains.length > 0;

    const kvTestKey = '__health_check__';
    await env.KV.get('health:ping');
    const kvValue = await env.KV.get(kvTestKey);
    const kvOk = kvValue === 'ok';

    const ready = dbOk && kvOk;

    return success({
      status: ready ? 'ready' : 'not_ready',
      db: dbOk ? 'ok' : 'error',
      kv: kvOk ? 'ok' : 'error',
      domains,
    });
  } catch (err) {
    return success({
      status: 'not_ready',
      db: 'error',
      kv: 'error',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
