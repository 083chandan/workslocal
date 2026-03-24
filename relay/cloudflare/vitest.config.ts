import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/*.test.ts'],
    exclude: ['__tests__/integration/**'],
    testTimeout: 30_000,
    hookTimeout: 15_000,
    // Integration tests need sequential execution (shared wrangler dev state)
    sequence: {
      concurrent: false,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/db/migrations/**'],
    },
  },
});
