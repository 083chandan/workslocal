import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  // Bundle workspace deps into the CLI so npm install doesn't need monorepo resolution
  noExternal: ['@workslocal/client', '@workslocal/shared'],
  external: ['ws'], // CJS module - can't bundle into ESM
  banner: {
    // Shebang for global CLI execution
    js: '#!/usr/bin/env node',
  },
});
