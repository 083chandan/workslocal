import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CONFIG_DIR = path.join(os.homedir(), '.workslocal');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// ─── Config types ────────────────────────────────────────

export interface CliConfig {
  anonymousToken?: string;
  sessionToken?: string;
  apiKeyId?: string;
  userId?: string;
  email?: string;
  serverUrl?: string;
}

// ─── Read / Write ────────────────────────────────────────

export function readConfig(): CliConfig {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as CliConfig;
  } catch {
    return {};
  }
}

export function writeConfig(config: CliConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

// ─── Server URL resolution ───────────────────────────────

/**
 * Resolve the relay server WebSocket URL.
 *
 * Priority:
 * 1. --server flag (explicit override)
 * 2. WORKSLOCAL_SERVER_URL environment variable
 * 3. ~/.workslocal/config.json serverUrl
 * 4. Default: wss://api.workslocal.dev/ws (production)
 *
 * For local development: WORKSLOCAL_SERVER_URL=ws://localhost:8787/ws
 */
export function getServerUrl(flagValue?: string): string {
  if (flagValue) return flagValue;

  const envUrl = process.env['WORKSLOCAL_SERVER_URL'];
  if (envUrl) return envUrl;

  const config = readConfig();
  if (config.serverUrl) return config.serverUrl;

  return 'wss://api.workslocal.dev/ws';
}
