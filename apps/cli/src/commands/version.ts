import chalk from 'chalk';

/**
 * workslocal version
 *
 * Prints the CLI version, Node version, and platform.
 */
export function versionCommand(): void {
  // TODO: read from package.json dynamically after build
  const version = '0.0.1';

  console.log();
  console.log(`${chalk.bold('workslocal')} ${chalk.cyan(`v${version}`)}`);
  console.log(`${chalk.gray(`Node ${process.version} on ${process.platform} ${process.arch}`)}`);
  console.log();
}
