import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

const exec = promisify(execFile);
const CLI = resolve(__dirname, '../dist/index.js');

// Helper to run CLI and capture output
async function runCli(
  args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await exec('node', [CLI, ...args]);
    return { stdout, stderr, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', exitCode: e.code ?? 1 };
  }
}

// NOTE: These tests require the CLI to be built first (pnpm turbo run build)

describe('CLI', () => {
  describe('--help', () => {
    it('shows usage text', async () => {
      const { stdout } = await runCli(['--help']);
      expect(stdout).toContain('workslocal');
      expect(stdout).toContain('http');
      expect(stdout).toContain('catch');
    });
  });

  describe('--version', () => {
    it('outputs a semver version number', async () => {
      const { stdout } = await runCli(['--version']);
      expect(stdout.trim()).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('http command validation', () => {
    it('rejects missing port argument', async () => {
      const { exitCode } = await runCli(['http']);
      expect(exitCode).not.toBe(0);
    });
  });
});
