import chalk from 'chalk';

import { CliConfig, getServerUrl, readConfig, writeConfig } from '../utils/config.js';

export async function logoutCommand(): Promise<void> {
  const config = readConfig();

  if (!config.sessionToken || !config.apiKeyId) {
    console.log(chalk.yellow('Not logged in.'));
    return;
  }

  // Revoke the API key server-side
  try {
    const serverUrl = getServerUrl();
    const httpBase = serverUrl
      .replace('wss://', 'https://')
      .replace('ws://', 'http://')
      .replace(/\/ws$/, '');

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

  console.log(chalk.green('Logged out successfully.'));
}
