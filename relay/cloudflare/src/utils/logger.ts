import type { WLLogger } from '@workslocal/shared';

/**
 * Worker-specific WLLogger implementation.
 *
 * Cloudflare Workers capture console output via Logpush.
 * We wrap console methods to produce structured JSON logs
 * consistent with the WLLogger interface from @workslocal/shared.
 */
export function createWorkerLogger(module?: string): WLLogger {
  const base = module ? { module } : {};

  function log(level: string, msg: string, data?: Record<string, unknown>): void {
    const entry = {
      level,
      msg,
      ...base,
      ...data,
      ts: new Date().toISOString(),
    };

    switch (level) {
      case 'fatal':
      case 'error':
        console.error(JSON.stringify(entry));
        break;
      case 'warn':
        console.warn(JSON.stringify(entry));
        break;
      case 'debug':
      case 'trace':
        console.debug(JSON.stringify(entry));
        break;
      default:
        console.log(JSON.stringify(entry));
    }
  }

  return {
    fatal: (msg, data) => log('fatal', msg, data),
    error: (msg, data) => log('error', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    info: (msg, data) => log('info', msg, data),
    debug: (msg, data) => log('debug', msg, data),
    trace: (msg, data) => log('trace', msg, data),
    child: (context?: Record<string, unknown>): WLLogger => {
      const childModule = (context?.module as string) ?? module;
      return createWorkerLogger(childModule);
    },
  };
}
