import chalk from 'chalk';

import { getHttpBaseUrl } from '../lib/api.js';
import { printError, printWarning } from '../lib/display.js';
import { readConfig } from '../utils/config.js';

export async function listCommand(): Promise<void> {
  const config = readConfig();

  if (!config.sessionToken) {
    printWarning('Not logged in.', 'Run "workslocal login" first.');
    return;
  }

  const httpBase = getHttpBaseUrl();

  const res = await fetch(`${httpBase}/api/v1/tunnels`, {
    headers: { Authorization: `Bearer ${config.sessionToken}` },
  });

  if (!res.ok) {
    printError('Failed to fetch tunnels.');
    return;
  }

  const data = (await res.json()) as {
    data: {
      tunnels: Array<{
        subdomain: string;
        domain: string;
        lastActivity: string | null;
        createdAt: string;
      }>;
    };
  };

  const tunnels = data.data.tunnels;

  if (tunnels.length === 0) {
    console.log(chalk.dim('No persistent subdomains claimed.'));
    return;
  }

  console.log(
    chalk.bold(
      `\n  ${String(tunnels.length)} persistent subdomain${tunnels.length > 1 ? 's' : ''}:\n`,
    ),
  );

  for (const t of tunnels) {
    const url = `https://${t.subdomain}.${t.domain}`;
    const lastUsed = t.lastActivity
      ? chalk.dim(`last used ${new Date(t.lastActivity).toLocaleDateString()}`)
      : chalk.dim('never used');
    console.log(`  ${chalk.cyan(url)}  ${lastUsed}`);
  }

  console.log('');
}
