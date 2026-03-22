import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CONFIG_DIR = path.join(os.homedir(), '.workslocal');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface ClientConfig {
  anonymousToken?: string;
  sessionToken?: string;
  userId?: string;
  serverUrl?: string;
}

/**
 * Read the local config file.
 * Returns empty object if file doesn't exist or is corrupt.
 */
function readConfig(): ClientConfig {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as ClientConfig;
  } catch {
    return {};
  }
}

/**
 * Write the local config file.
 * Creates ~/.workslocal/ directory if it doesn't exist.
 */
function writeConfig(config: ClientConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Get or create an anonymous token.
 *
 * The token is stored in ~/.workslocal/config.json so it survives
 * CLI restarts. This gives anonymous users a consistent identity
 * for subdomain reservation on reconnect.
 *
 */
export function getAnonymousToken(): string {
  const config = readConfig();

  if (config.anonymousToken) {
    return config.anonymousToken;
  }

  const token = crypto.randomBytes(32).toString('hex');
  writeConfig({ ...config, anonymousToken: token });
  return token;
}

/**
 * Clear stored credentials.
 * Used by `workslocal logout`.
 */
export function clearCredentials(): void {
  try {
    fs.unlinkSync(CONFIG_FILE);
  } catch {
    // File doesn't exist - that's fine
  }
}
