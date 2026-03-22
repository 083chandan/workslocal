import { TunnelClient } from '@workslocal/client';

import { printError, printTunnelList } from '../lib/display.js';
import { createCliLogger } from '../lib/logger.js';
import { getServerUrl } from '../utils/config.js';

interface StatusCommandOptions {
  server?: string | undefined;
}

/**
 * workslocal status
 *
 * Lists all active tunnels on the current connection.
 *
 * Note: For  (anonymous, no auth), this only shows tunnels
 * from the current CLI session.  (authenticated) will query
 * the server API to show all user tunnels across sessions.
 */
export async function statusCommand(options: StatusCommandOptions): Promise<void> {
  const serverUrl = getServerUrl(options.server);
  const logger = createCliLogger();

  const client = new TunnelClient({
    serverUrl,
    logger,
    autoReconnect: false, // don't retry - just check and exit
  });

  try {
    await client.connect();
    // : no API to query tunnels - just show that we connected
    // : GET /api/v1/tunnels with auth
    printTunnelList(client.getAllTunnels());
    client.disconnect();
  } catch (err) {
    printError(
      'Could not connect to relay server',
      err instanceof Error ? err.message : 'Check your network connection.',
    );
    process.exit(1);
  }
}
