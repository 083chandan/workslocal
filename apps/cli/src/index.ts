import chalk from 'chalk';
import { Command } from 'commander';

import { catchCommand } from './commands/catch.js';
import { httpCommand } from './commands/http.js';
import { listCommand } from './commands/list.js';
import { loginCommand } from './commands/login.js';
import { logoutCommand } from './commands/logout.js';
import { statusCommand } from './commands/status.js';
import { stopCommand } from './commands/stop.js';
import { getVersion, versionCommand } from './commands/version.js';
import { whoamiCommand } from './commands/whoami.js';
import { printError } from './lib/display.js';

const program = new Command();

program
  .name('workslocal')
  .description('Free, open-source localhost tunneling. It works on my local.')
  .version(getVersion(), '-v, --version');

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

// ─── workslocal catch ──────────────────────────────────
program
  .command('catch')
  .description('Capture requests without a local server (webhook debugging)')
  .option('-n, --name <subdomain>', 'Custom subdomain')
  .option('-d, --domain <domain>', 'Tunnel domain')
  .option('-s, --status <code>', 'Response status code', '200')
  .option('-b, --body <json>', 'Response body', '{"ok":true}')
  .option('--server <url>', 'Override relay server URL')
  .option('-v, --verbose', 'Verbose logging')
  .action(catchCommand);

// ─── workslocal login ───────────────────────────────────
program
  .command('login')
  .description('Authenticate with GitHub via WorksLocal')
  .action(loginCommand);

// ─── workslocal logout ──────────────────────────────────
program
  .command('logout')
  .description('Sign out and clear stored credentials')
  .action(logoutCommand);

// ─── workslocal whoami ──────────────────────────────────
program.command('whoami').description('Show current authenticated user').action(whoamiCommand);

// ─── workslocal list ──────────────────────────────────
program.command('list').description('List your persistent subdomains').action(listCommand);

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
if (process.argv.length <= 2) {
  // No args — show friendly welcome instead of generic help
  const version = getVersion();
  console.log();
  console.log(`  ${chalk.bold('WorksLocal')} ${chalk.dim(`v${version}`)}`);
  console.log();
  console.log(`  ${chalk.dim('Free, open-source localhost tunneling.')}`);
  console.log();
  console.log(`  ${chalk.cyan('workslocal http 3000')}       Tunnel localhost:3000`);
  console.log(`  ${chalk.cyan('workslocal catch')}           Capture webhooks`);
  console.log(`  ${chalk.cyan('workslocal login')}           Sign in with GitHub`);
  console.log(`  ${chalk.cyan('workslocal --help')}          All commands`);
  console.log();
} else {
  program.parseAsync(process.argv).catch((err: unknown) => {
    printError(`Fatal error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
