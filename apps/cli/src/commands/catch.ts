import {
  LocalProxyResponse,
  TunnelClient,
  createCatchProxy,
  createInspectorServer,
} from '@workslocal/client';
import chalk from 'chalk';
import ora from 'ora';

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

    console.log('');
    console.log('──────────────────────────────────────────────────────────────');
    console.log(`  ${chalk.green('✔')} Catch mode active!`);
    console.log('');
    console.log(`  Public URL:   ${chalk.cyan(tunnel.publicUrl)}`);
    if (inspector) {
      console.log(`  Inspector:    ${chalk.cyan('http://localhost:4040')}`);
    }
    console.log(
      `  Returning:    ${chalk.yellow(`${String(statusCode)} ${responseBody.slice(0, 50)}`)}`,
    );
    console.log(
      `  Subdomain:    ${tunnel.subdomain}${tunnel.isPersistent ? chalk.dim(' (persistent)') : ''}`,
    );
    console.log('');
    console.log('  Paste the URL in your webhook dashboard.');
    console.log('  All requests appear below and at localhost:4040.');
    console.log('');
    console.log('  Press Ctrl+C to stop.');
    console.log('──────────────────────────────────────────────────────────────');
    console.log('');
  });

  client.on('request:complete', (captured) => {
    requestCount++;

    const statusColor =
      captured.responseStatusCode < 400
        ? chalk.green(String(captured.responseStatusCode))
        : chalk.red(String(captured.responseStatusCode));

    const method = captured.method.padEnd(6);
    console.log(
      `  ${chalk.bold(method)} ${captured.path} → ${statusColor} ${chalk.dim(`(${String(captured.responseTimeMs)}ms)`)}`,
    );

    inspector?.pushRequest(captured);
  });

  client.on('request:error', (_requestId: string, error: string) => {
    console.error(chalk.red(`  ✖ Request failed: ${error}`));
  });

  client.on('disconnected', (code: number, reason: string) => {
    console.log(chalk.yellow(`  ⚡ Disconnected: ${String(code)} ${reason}`));
  });

  client.on('reconnecting', (attempt: number, maxAttempts: number) => {
    console.log(chalk.yellow(`  🔄 Reconnecting... (${String(attempt)}/${String(maxAttempts)})`));
  });

  client.on('reconnect_failed', () => {
    console.error(chalk.red('  ✖ Could not reconnect to relay server'));
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
    console.error(
      chalk.red(`  ✖ Failed to create tunnel: ${err instanceof Error ? err.message : String(err)}`),
    );
    inspector?.stop();
    client.disconnect();
    process.exit(1);
  }

  // ─── Graceful shutdown ───────────────────────────────────
  const shutdown = (): void => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(uptime / 60);
    const seconds = uptime % 60;

    console.log('');
    console.log('──────────────────────────────────────────────────────────────');
    console.log('  Session summary:');
    console.log(`  Requests captured: ${String(requestCount)}`);
    console.log(`  Uptime:            ${String(minutes)}m ${String(seconds)}s`);
    console.log('──────────────────────────────────────────────────────────────');

    inspector?.stop();
    client.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown());
  process.on('SIGTERM', () => shutdown());
}
