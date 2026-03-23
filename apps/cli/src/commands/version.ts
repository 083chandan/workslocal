import chalk from 'chalk';

const CLI_VERSION = process.env.CLI_VERSION ?? '0.1.0';

export function getVersion(): string {
  return CLI_VERSION;
}

/**
 * workslocal version
 *
 * Prints the CLI version, Node version, and platform.
 */
export function versionCommand(): void {
  console.log();
  console.log(`${chalk.bold('workslocal')} ${chalk.cyan(`v${getVersion()}`)}`);
  console.log(`${chalk.gray(`Node ${process.version} on ${process.platform} ${process.arch}`)}`);
  console.log();
}
