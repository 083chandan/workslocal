import chalk from 'chalk';

import { readConfig } from '../utils/config.js';

export function whoamiCommand(): void {
  const config = readConfig();

  if (!config.sessionToken) {
    console.log(chalk.yellow('Not logged in. Run "workslocal login" to authenticate.'));
    return;
  }

  console.log(chalk.bold(config.email ?? 'Authenticated (no email on file)'));
}
