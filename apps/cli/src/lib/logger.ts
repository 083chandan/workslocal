import type { WLLogger } from '@workslocal/shared';
import chalk from 'chalk';

const LEVEL_COLORS = {
  fatal: chalk.bgRed.white,
  error: chalk.red,
  warn: chalk.yellow,
  info: chalk.blue,
  debug: chalk.gray,
  trace: chalk.dim,
} as const;

const LEVEL_PRIORITY: Record<string, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

interface CliLoggerOptions {
  verbose?: boolean | undefined;
}

export function createCliLogger(options?: CliLoggerOptions): WLLogger {
  // verbose: show debug + trace. Default: info and above.
  const minLevel = options?.verbose ? 0 : 2;

  function log(
    level: keyof typeof LEVEL_COLORS,
    msg: string,
    data?: Record<string, unknown>,
  ): void {
    if ((LEVEL_PRIORITY[level] ?? 2) < minLevel) return;

    const colorFn = LEVEL_COLORS[level];
    // info level gets no prefix - cleaner output for normal messages
    const prefix = level === 'info' ? '' : `${colorFn(`[${level}]`)} `;
    const suffix = data ? chalk.gray(` ${JSON.stringify(data)}`) : '';

    // Write to stderr so stdout stays clean for piping
    process.stderr.write(`${prefix}${msg}${suffix}\n`);
  }

  return {
    fatal: (msg, data) => log('fatal', msg, data),
    error: (msg, data) => log('error', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    info: (msg, data) => log('info', msg, data),
    debug: (msg, data) => log('debug', msg, data),
    trace: (msg, data) => log('trace', msg, data),
    child: (): WLLogger => createCliLogger(options),
  };
}
