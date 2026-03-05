import { Command } from 'commander';

import { httpCommand } from './commands/http.js';
import { statusCommand } from './commands/status.js';
import { stopCommand } from './commands/stop.js';
import { versionCommand } from './commands/version.js';

const program = new Command();

program
  .name('workslocal')
  .description('Expose localhost to the internet — free, open-source tunneling tool')
  .version('0.0.1', '-v, --version', 'Print version');

// ─── workslocal http <port> ──────────────────────────────
program
  .command('http')
  .description('Create a tunnel forwarding to localhost:<port>')
  .argument('<port>', 'Local port to forward to')
  .option('-n, --name <subdomain>', 'Custom subdomain (e.g., myapp)')
  .option('-d, --domain <domain>', 'Tunnel domain (default: workslocal.exposed)')
  .option('-s, --server <url>', 'Relay server URL (for development)')
  .option('--verbose', 'Show debug-level logs')
  .action(async (port: string, options: Record<string, string | boolean | undefined>) => {
    await httpCommand(port, {
      name: options['name'] as string | undefined,
      domain: options['domain'] as string | undefined,
      server: options['server'] as string | undefined,
      verbose: options['verbose'] as boolean | undefined,
    });
  });

// ─── workslocal status ──────────────────────────────────
program
  .command('status')
  .description('List active tunnels')
  .option('-s, --server <url>', 'Relay server URL')
  .action(async (options: Record<string, string | undefined>) => {
    await statusCommand({
      server: options['server'],
    });
  });

// ─── workslocal stop [name] ─────────────────────────────
program
  .command('stop')
  .description('Stop a tunnel by name')
  .argument('[name]', 'Subdomain name of the tunnel to stop')
  .option('-a, --all', 'Stop all tunnels')
  .option('-s, --server <url>', 'Relay server URL')
  .action((name: string | undefined, options: Record<string, string | boolean | undefined>) => {
    stopCommand(name, {
      all: options['all'] as boolean | undefined,
      server: options['server'] as string | undefined,
    });
  });

// ─── workslocal version (alternative to -v) ─────────────
program
  .command('version')
  .description('Print version information')
  .action(() => {
    versionCommand();
  });

// ─── Parse and run ──────────────────────────────────────
program.parseAsync(process.argv).catch((err: unknown) => {
  console.error('Fatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
