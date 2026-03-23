import chalk from 'chalk';

import { printWarning } from '../lib/display.js';
import { readConfig } from '../utils/config.js';

export function whoamiCommand(): void {
  const config = readConfig();

  if (!config.sessionToken) {
    printWarning('Not logged in.', 'Run "workslocal login" to authenticate.');
    return;
  }

  console.log(chalk.bold(config.email ?? 'Authenticated (no email on file)'));
}
