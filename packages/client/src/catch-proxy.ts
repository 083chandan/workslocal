import type { WLLogger, HttpRequestMessage } from '@workslocal/shared';

import type { LocalProxyResponse } from './local-proxy.js';

interface CatchProxyOptions {
  statusCode: number;
  responseBody: string;
  responseHeaders: Record<string, string>;
  logger: WLLogger;
}

export interface CatchProxy {
  respond(msg: HttpRequestMessage): LocalProxyResponse;
}

/**
 * CatchProxy - returns a static response without forwarding to localhost.
 *
 * Used by `workslocal catch`. Every incoming request gets the same
 * configurable response (default: 200 OK with empty body).
 */
export function createCatchProxy(options: CatchProxyOptions): CatchProxy {
  const log = options.logger.child({ module: 'catch-proxy' });

  return {
    respond(msg: HttpRequestMessage): LocalProxyResponse {
      log.debug('Catch mode - returning static response', {
        method: msg.method,
        path: msg.path,
        statusCode: String(options.statusCode),
      });

      return {
        statusCode: options.statusCode,
        headers: {
          'content-type': 'application/json',
          'x-workslocal-mode': 'catch',
          ...options.responseHeaders,
        },
        body: Buffer.from(options.responseBody || '').toString('base64'),
      };
    },
  };
}
