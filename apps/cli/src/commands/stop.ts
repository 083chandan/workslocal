import chalk from 'chalk';

import { printError } from '../lib/display.js';

interface StopCommandOptions {
  all?: boolean | undefined;
  server?: string | undefined;
}

/**
 * workslocal stop [name]
 *
 * Stops a tunnel by subdomain name, or all tunnels with --all.
 *
 * : This is a placeholder - anonymous tunnels can only be
 * stopped via Ctrl+C in the running CLI session.
 * : Will use the REST API to stop tunnels by name.
 */
export function stopCommand(name: string | undefined, options: StopCommandOptions): void {
  if (!name && !options.all) {
    printError(
      'Specify a tunnel name or use --all',
      'Usage: workslocal stop myapp  or  workslocal stop --all',
    );
    process.exit(1);
  }

  // : No API to stop tunnels remotely
  // : DELETE /api/v1/tunnels/:name or DELETE /api/v1/tunnels?all=true
  console.log(chalk.yellow('Remote tunnel management requires authentication (coming in v0.2)'));
  console.log(chalk.gray('For now, press Ctrl+C in the running tunnel session to stop it.'));
  console.log();
}
