import type { CapturedRequest, TunnelInfo } from '@workslocal/client';
import chalk from 'chalk';

// ─── Method colors ───────────────────────────────────────

const METHOD_COLORS: Record<string, (text: string) => string> = {
  GET: chalk.green,
  POST: chalk.blue,
  PUT: chalk.yellow,
  PATCH: chalk.yellow,
  DELETE: chalk.red,
  HEAD: chalk.cyan,
  OPTIONS: chalk.gray,
};

function colorMethod(method: string): string {
  const colorFn = METHOD_COLORS[method.toUpperCase()] ?? chalk.white;
  return colorFn(method.toUpperCase().padEnd(7));
}

// ─── Status colors ───────────────────────────────────────

function colorStatus(status: number): string {
  if (status >= 500) return chalk.red(String(status));
  if (status >= 400) return chalk.yellow(String(status));
  if (status >= 300) return chalk.cyan(String(status));
  if (status >= 200) return chalk.green(String(status));
  return chalk.gray(String(status));
}

// ─── Startup banner ──────────────────────────────────────

export function printBanner(tunnel: TunnelInfo, inspectorUrl: string | null = null): void {
  const line = chalk.gray('─'.repeat(60));

  console.log();
  console.log(line);
  console.log();
  console.log(`${chalk.bold.green('✔')} ${chalk.bold('Tunnel is live!')}`);
  console.log();
  console.log(`${chalk.gray('Public URL:')}   ${chalk.bold.cyan(tunnel.publicUrl)}`);
  console.log(
    `${chalk.gray('Forwarding:')}   ${chalk.white(`http://localhost:${String(tunnel.localPort)}`)}`,
  );
  if (inspectorUrl) {
    console.log(`${chalk.gray('Inspector:')}    ${chalk.cyan(inspectorUrl)}`);
  }
  console.log(`${chalk.gray('Subdomain:')}    ${chalk.white(tunnel.subdomain)}`);
  console.log(`${chalk.gray('Domain:')}       ${chalk.white(tunnel.domain)}`);

  if (tunnel.isPersistent) {
    console.log(`${chalk.gray('Type:')}         ${chalk.white('persistent (survives restart)')}`);
  } else if (tunnel.expiresAt) {
    console.log(`${chalk.gray('Expires:')}      ${chalk.yellow(tunnel.expiresAt)}`);
  }

  console.log();
  console.log(
    `${chalk.gray('Press')} ${chalk.white('Ctrl+C')} ${chalk.gray('to stop the tunnel')}`,
  );
  console.log();
  console.log(line);
  console.log();
}

// ─── Request log line ────────────────────────────────────

export function printRequest(req: CapturedRequest): void {
  const method = colorMethod(req.method);
  const status = colorStatus(req.responseStatusCode);
  const time = chalk.gray(`${String(req.responseTimeMs)}ms`);
  const path = chalk.white(req.path);

  console.log(`${method} ${path} ${status} ${time}`);
}

// ─── Shutdown summary ────────────────────────────────────

export function printSummary(totalRequests: number, uptime: number): void {
  const uptimeStr = formatUptime(uptime);

  console.log();
  console.log(chalk.gray('─'.repeat(60)));
  console.log();
  console.log(`${chalk.bold('Session summary:')}`);
  console.log(`${chalk.gray('Requests forwarded:')} ${chalk.white(String(totalRequests))}`);
  console.log(`${chalk.gray('Uptime:')}             ${chalk.white(uptimeStr)}`);
  console.log();
}

// ─── Reconnecting message ────────────────────────────────

export function printReconnecting(attempt: number, maxAttempts: number): void {
  console.log(`${chalk.yellow('⟳')} Reconnecting... (${String(attempt)}/${String(maxAttempts)})`);
}

// ─── Error display ───────────────────────────────────────

export function printError(message: string, suggestion?: string): void {
  console.log();
  console.log(`${chalk.red('✖')} ${chalk.red(message)}`);
  if (suggestion) {
    console.log(`${chalk.gray(suggestion)}`);
  }
  console.log();
}

// ─── Connection status ───────────────────────────────────

export function printConnecting(): void {
  // Returns nothing - ora spinner handles this
}

export function printDisconnected(code: number, reason: string): void {
  console.log(`\n${chalk.yellow('⚡')} Disconnected: ${String(code)} ${reason}`);
}

// ─── Status table ────────────────────────────────────────

export function printTunnelList(tunnels: readonly TunnelInfo[]): void {
  if (tunnels.length === 0) {
    console.log(chalk.gray('  No active tunnels'));
    return;
  }

  console.log();
  for (const tunnel of tunnels) {
    const status = chalk.green('●');
    console.log(`${status} ${chalk.cyan(tunnel.publicUrl)}`);
    console.log(`${chalk.gray('→')} localhost:${String(tunnel.localPort)}`);
    console.log(`${chalk.gray('ID:')} ${tunnel.tunnelId}`);
    console.log();
  }
}

// ─── Warning display ────────────────────────────────────

export function printWarning(message: string, hint?: string): void {
  console.log(`${chalk.yellow('⚠')} ${chalk.yellow(message)}`);
  if (hint) {
    console.log(`  ${chalk.gray(hint)}`);
  }
}

// ─── Success display ────────────────────────────────────

export function printSuccess(message: string): void {
  console.log(`${chalk.green('✔')} ${chalk.green(message)}`);
}

// ─── Catch mode banner ──────────────────────────────────

interface CatchBannerOptions {
  publicUrl: string;
  inspectorUrl: string | null;
  statusCode: number;
  responseBody: string;
  subdomain: string;
  isPersistent: boolean;
}

export function printCatchBanner(opts: CatchBannerOptions): void {
  const line = chalk.gray('─'.repeat(60));

  console.log();
  console.log(line);
  console.log();
  console.log(`${chalk.bold.green('✔')} ${chalk.bold('Catch mode active!')}`);
  console.log();
  console.log(`${chalk.gray('Public URL:')}   ${chalk.bold.cyan(opts.publicUrl)}`);
  if (opts.inspectorUrl) {
    console.log(`${chalk.gray('Inspector:')}    ${chalk.cyan(opts.inspectorUrl)}`);
  }
  console.log(
    `${chalk.gray('Returning:')}    ${chalk.yellow(`${String(opts.statusCode)} ${opts.responseBody.slice(0, 50)}`)}`,
  );
  console.log(
    `${chalk.gray('Subdomain:')}    ${chalk.white(opts.subdomain)}${opts.isPersistent ? chalk.dim(' (persistent)') : ''}`,
  );
  console.log();
  console.log(`${chalk.gray('Paste the URL in your webhook dashboard.')}`);
  console.log(
    `${chalk.gray('All requests appear below')}${opts.inspectorUrl ? chalk.gray(` and at ${opts.inspectorUrl}`) : chalk.gray('.')}`,
  );
  console.log();
  console.log(`${chalk.gray('Press')} ${chalk.white('Ctrl+C')} ${chalk.gray('to stop.')}`);
  console.log();
  console.log(line);
  console.log();
}

// ─── Helpers ─────────────────────────────────────────────

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${String(hours)}h ${String(minutes % 60)}m`;
  if (minutes > 0) return `${String(minutes)}m ${String(seconds % 60)}s`;
  return `${String(seconds)}s`;
}
