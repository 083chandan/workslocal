import {
  LocalProxyResponse,
  TunnelClient,
  createCatchProxy,
  createInspectorServer,
} from '@workslocal/client';
import ora from 'ora';

import {
  printCatchBanner,
  printDisconnected,
  printError,
  printReconnecting,
  printRequest,
  printSummary,
} from '../lib/display.js';
import { createCliLogger } from '../lib/logger.js';
import { getServerUrl, readConfig } from '../utils/config.js';
import { getInspectorDistPath } from '../utils/inspector-path.js';

interface CatchOptions {
  name?: string;
  domain?: string;
  status?: string;
  body?: string;
  server?: string;
  verbose?: boolean;
}

/**
 * workslocal catch [--name stripe] [--status 200] [--body '{"ok":true}']
 *
 * Creates a tunnel that captures requests WITHOUT forwarding to localhost.
 * Returns a configurable static response (default: 200 OK).
 * Starts web inspector at localhost:4040.
 */
export async function catchCommand(options: CatchOptions): Promise<void> {
  const config = readConfig();
  const serverUrl = getServerUrl(options.server);
  const logger = createCliLogger({ verbose: options.verbose });
  const statusCode = parseInt(options.status ?? '200', 10);
  const responseBody = options.body ?? '{"ok":true}';

  // Create catch proxy (static response, no localhost)
  const catchProxy = createCatchProxy({
    statusCode,
    responseBody,
    responseHeaders: {},
    logger,
  });

  // Create tunnel client - pass catchProxy as proxyOverride
  const client = new TunnelClient({
    serverUrl,
    logger,
    clientVersion: '0.0.1',
    authToken: config.sessionToken ?? undefined,
    proxyOverride: (msg): LocalProxyResponse | Promise<LocalProxyResponse> =>
      catchProxy.respond(msg),
  });

  // Start inspector server
  const inspectorDistPath = getInspectorDistPath();
  let inspector: ReturnType<typeof createInspectorServer> | null = null;

  if (inspectorDistPath) {
    inspector = createInspectorServer({
      port: 4040,
      inspectorDistPath,
      requestStore: client.requestStore,
      logger,
    });
    await inspector.start();
  }

  const startTime = Date.now();
  let requestCount = 0;

  // ─── Connect ─────────────────────────────────────────────
  const spinner = ora('Connecting to relay server...').start();

  try {
    await client.connect();
    spinner.succeed('Connected to relay server');
  } catch (err) {
    spinner.fail(`Connection failed: ${err instanceof Error ? err.message : String(err)}`);
    inspector?.stop();
    process.exit(1);
  }

  // ─── Event handlers ──────────────────────────────────────
  client.on('tunnel:created', (tunnel) => {
    inspector?.setState({
      tunnelInfo: tunnel,
      mode: 'catch',
      localPort: null,
      email: config.email ?? null,
    });

    printCatchBanner({
      publicUrl: tunnel.publicUrl,
      inspectorUrl: inspector ? 'http://localhost:4040' : null,
      statusCode,
      responseBody,
      subdomain: tunnel.subdomain,
      isPersistent: tunnel.isPersistent,
    });
  });

  client.on('request:complete', (captured) => {
    requestCount++;
    printRequest(captured);
    inspector?.pushRequest(captured);
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
    printError('Could not reconnect to relay server', 'Check your network connection.');
    inspector?.stop();
    process.exit(1);
  });

  client.on('error', (err: Error) => {
    logger.debug('Client error', { err: err.message });
  });

  // ─── Create tunnel ──────────────────────────────────────
  try {
    await client.createTunnel({
      port: 0,
      name: options.name,
      domain: options.domain,
    });
  } catch (err) {
    printError(`Failed to create tunnel: ${err instanceof Error ? err.message : String(err)}`);
    inspector?.stop();
    client.disconnect();
    process.exit(1);
  }

  // ─── Graceful shutdown ───────────────────────────────────
  const shutdown = (): void => {
    printSummary(requestCount, Date.now() - startTime);
    inspector?.stop();
    client.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown());
  process.on('SIGTERM', () => shutdown());
}
