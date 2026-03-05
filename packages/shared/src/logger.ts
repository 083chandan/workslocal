/**
 * Universal logger interface for WorksLocal.
 *
 * Every app creates its own implementation (Pino, chalk, console).
 * Every package/service accepts this interface via DI.
 * This ensures consistent log method signatures across the entire monorepo
 * without coupling to a specific logging library.
 */

export interface WLLogger {
  fatal(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  info(msg: string, data?: Record<string, unknown>): void;
  debug(msg: string, data?: Record<string, unknown>): void;
  trace(msg: string, data?: Record<string, unknown>): void;

  /** Create a child logger with bound context (e.g., { service: "tunnel" }) */
  child(bindings: Record<string, unknown>): WLLogger;
}

const noop = (): void => {};

export const silentLogger: WLLogger = {
  fatal: noop,
  error: noop,
  warn: noop,
  info: noop,
  debug: noop,
  trace: noop,
  child: () => silentLogger,
};

function createConsoleMethod(level: string): (msg: string, data?: Record<string, unknown>) => void {
  return (msg: string, data?: Record<string, unknown>) => {
    if (data && Object.keys(data).length > 0) {
      console[level === 'fatal' || level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        `[${level.toUpperCase()}] ${msg}`,
        data,
      );
    } else {
      console[level === 'fatal' || level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        `[${level.toUpperCase()}] ${msg}`,
      );
    }
  };
}

export function createConsoleLogger(bindings?: Record<string, unknown>): WLLogger {
  return {
    fatal: createConsoleMethod('fatal'),
    error: createConsoleMethod('error'),
    warn: createConsoleMethod('warn'),
    info: createConsoleMethod('info'),
    debug: createConsoleMethod('debug'),
    trace: createConsoleMethod('trace'),
    child: (childBindings) => createConsoleLogger({ ...bindings, ...childBindings }),
  };
}
