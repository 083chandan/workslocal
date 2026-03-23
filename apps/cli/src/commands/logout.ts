import { getHttpBaseUrl } from '../lib/api.js';
import { printSuccess, printWarning } from '../lib/display.js';
import { CliConfig, readConfig, writeConfig } from '../utils/config.js';

export async function logoutCommand(): Promise<void> {
  const config = readConfig();

  if (!config.sessionToken || !config.apiKeyId) {
    printWarning('Not logged in.');
    return;
  }

  // Revoke the API key server-side
  try {
    const httpBase = getHttpBaseUrl();

    await fetch(`${httpBase}/api/v1/keys/${config.apiKeyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${config.sessionToken}` },
    });
  } catch {
    // Best effort - key will be orphaned but harmless
  }

  const cleared: CliConfig = {};
  if (config.anonymousToken) {
    cleared.anonymousToken = config.anonymousToken;
  }
  writeConfig(cleared);

  printSuccess('Logged out successfully.');
}
