import { cpSync, existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { defineConfig } from 'tsup';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  noExternal: ['@workslocal/client', '@workslocal/shared'],
  external: ['chalk', 'commander', 'ora', 'ws'],
  onSuccess: () => {
    const src = resolve(__dirname, '../inspector/dist');
    const dest = resolve(__dirname, 'dist/inspector');
    if (existsSync(src)) {
      cpSync(src, dest, { recursive: true });
      console.log('✔ Copied inspector dist to cli/dist/inspector/');
    }
    return Promise.resolve();
  },
  define: {
    'process.env.CLI_VERSION': JSON.stringify(pkg.version),
  },
});
