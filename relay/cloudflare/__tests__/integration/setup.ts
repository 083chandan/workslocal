import { beforeAll } from 'vitest';

const BASE_URL = process.env.RELAY_BASE_URL ?? 'http://localhost:8787';

beforeAll(async () => {
  const maxRetries = 5;
  const retryDelay = 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      const body = await res.json();

      if (body.ok && body.data && body.data.status === 'ok') {
        return;
      }
    } catch {
      // Server not ready yet
    }

    if (i < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, retryDelay));
    }
  }

  throw new Error(
    `Dev server not reachable at ${BASE_URL}/health after ${maxRetries} retries. ` +
      'Start it with: cd relay/cloudflare && pnpm dev',
  );
});
