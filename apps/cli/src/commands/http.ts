import { TunnelClient } from '@workslocal/client';
import type { CapturedRequest, TunnelInfo } from '@workslocal/client';
import ora from 'ora';

import {
  printBanner,
  printDisconnected,
  printError,
  printReconnecting,
  printRequest,
  printSummary,
} from '../lib/display.js';
import { createCliLogger } from '../lib/logger.js';
import { getServerUrl } from '../utils/config.js';

interface HttpCommandOptions {
  name?: string | undefined;
  domain?: string | undefined;
  server?: string | undefined;
  verbose?: boolean | undefined;
}

/**
 * workslocal http <port>
 *
 * Creates a tunnel forwarding from a public URL to localhost:<port>.
 * Streams incoming requests as a color-coded log.
 * Ctrl+C gracefully shuts down.
 */
export async function httpCommand(portStr: string, options: HttpCommandOptions): Promise<void> {
  // ─── Validate port ───────────────────────────────────────
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    printError(
      `Invalid port: ${portStr}`,
      'Port must be a number between 1 and 65535. Example: workslocal http 3000',
    );
    process.exit(1);
  }

  // ─── Create client ──────────────────────────────────────
  const serverUrl = getServerUrl(options.server);
  const logger = createCliLogger({ verbose: options.verbose });

  const client = new TunnelClient({
    serverUrl,
    logger,
    clientVersion: '0.0.1', // TODO: read from package.json
  });

  const startTime = Date.now();

  // ─── Connect ─────────────────────────────────────────────
  const connectSpinner = ora({
    text: 'Connecting to WorksLocal...',
    color: 'cyan',
  }).start();

  try {
    await client.connect();
    connectSpinner.succeed('Connected to relay server');
  } catch (err) {
    connectSpinner.fail('Failed to connect');
    printError(
      `Could not connect to ${serverUrl}`,
      err instanceof Error ? err.message : 'Check your network connection and try again.',
    );
    process.exit(1);
  }

  // ─── Create tunnel ──────────────────────────────────────
  const tunnelSpinner = ora({
    text: 'Creating tunnel...',
    color: 'cyan',
  }).start();

  let tunnel: TunnelInfo;
  try {
    tunnel = await client.createTunnel({
      port,
      name: options.name,
      domain: options.domain,
    });
    tunnelSpinner.stop(); // stop without message — banner shows the result
  } catch (err) {
    tunnelSpinner.fail('Failed to create tunnel');
    const message = err instanceof Error ? err.message : String(err);

    // Helpful error messages
    if (message.includes('SUBDOMAIN_TAKEN')) {
      printError(
        `Subdomain "${options.name ?? ''}" is already in use`,
        'Try a different name: workslocal http ' + portStr + ' --name something-else',
      );
    } else if (message.includes('MAX_TUNNELS_REACHED')) {
      printError(
        'Maximum tunnel limit reached (5)',
        'Stop an existing tunnel first: workslocal stop <name>',
      );
    } else if (message.includes('SUBDOMAIN_INVALID')) {
      printError(
        `Invalid subdomain: "${options.name ?? ''}"`,
        'Subdomains must be lowercase alphanumeric with optional hyphens (1-50 chars)',
      );
    } else {
      printError(`Tunnel creation failed: ${message}`);
    }

    client.disconnect();
    process.exit(1);
  }

  // ─── Print banner ────────────────────────────────────────
  printBanner(tunnel);

  // ─── Event handlers ──────────────────────────────────────
  client.on('request:complete', (req: CapturedRequest) => {
    printRequest(req);
  });

  client.on('request:error', (_requestId: string, error: string) => {
    printError(`Request failed: ${error}`);
  });

  client.on('disconnected', (code: number, reason: string) => {
    printDisconnected(code, reason);
  });

  client.on('reconnecting', (attempt: number, maxAttempts: number) => {
    printReconnecting(attempt, maxAttempts);
  });

  client.on('reconnect_failed', () => {
    printError(
      'Could not reconnect to relay server',
      'Check your network connection. The tunnel has been stopped.',
    );
    process.exit(1);
  });

  client.on('error', (err: Error) => {
    // Don't print every error — some are handled by specific handlers above
    logger.debug('Client error', { err: err.message });
  });

  // ─── Graceful shutdown ───────────────────────────────────
  const shutdown = (): Promise<void> => {
    console.log(); // newline after ^C

    const stopSpinner = ora({
      text: 'Stopping tunnel...',
      color: 'yellow',
    }).start();

    try {
      client.disconnect();
      stopSpinner.stop();

      const uptime = Date.now() - startTime;
      printSummary(client.requestStore.size, uptime);
    } catch {
      stopSpinner.fail('Error during shutdown');
    }

    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}
