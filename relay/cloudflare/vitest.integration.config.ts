import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/integration/*.integration.test.ts'],
    setupFiles: ['__tests__/integration/setup.ts'],
    testTimeout: 60_000,
    hookTimeout: 15_000,
    sequence: {
      concurrent: false,
    },
  },
});
