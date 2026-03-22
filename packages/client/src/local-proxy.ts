import http from 'node:http';

import type { WLLogger } from '@workslocal/shared';
import type { HttpRequestMessage } from '@workslocal/shared';

export interface LocalProxyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string; // base64
}

interface LocalProxyDeps {
  logger: WLLogger;
}

export interface LocalProxy {
  forward(
    msg: HttpRequestMessage,
    localPort: number,
    localHost?: string,
  ): Promise<LocalProxyResponse>;
}

export function createLocalProxy(deps: LocalProxyDeps): LocalProxy {
  const log = deps.logger.child({ module: 'local-proxy' });

  return {
    /**
     * Forward an http_request message to localhost.
     *
     * Reads snake_case fields from the WS message,
     * makes an HTTP request to localhost:{port},
     * captures the full response,
     * returns it ready to be sent back as http_response.
     */
    async forward(
      msg: HttpRequestMessage,
      localPort: number,
      localHost: string = 'localhost',
    ): Promise<LocalProxyResponse> {
      // Decode base64 request body
      const requestBody = msg.body ? Buffer.from(msg.body, 'base64') : null;

      // Build path with query string if present
      let fullPath = msg.path;
      const queryEntries = Object.entries(msg.query);
      if (queryEntries.length > 0 && !msg.path.includes('?')) {
        const params = new URLSearchParams(msg.query);
        fullPath = `${msg.path}?${params.toString()}`;
      }

      // Clean up headers - remove host (will be set to localhost)
      const headers = { ...msg.headers };
      delete headers.host;
      delete headers.Host;

      return new Promise<LocalProxyResponse>((resolve, reject) => {
        const options: http.RequestOptions = {
          hostname: localHost,
          port: localPort,
          path: fullPath,
          method: msg.method,
          headers,
          timeout: 30_000,
        };

        log.debug('Forwarding to local server', {
          method: msg.method,
          path: fullPath,
          port: String(localPort),
        });

        const proxyReq = http.request(options, (proxyRes) => {
          const chunks: Buffer[] = [];

          proxyRes.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          proxyRes.on('end', () => {
            const responseBody = Buffer.concat(chunks);

            // Flatten response headers to Record<string, string>
            const responseHeaders: Record<string, string> = {};
            for (const [key, value] of Object.entries(proxyRes.headers)) {
              if (typeof value === 'string') {
                responseHeaders[key] = value;
              } else if (Array.isArray(value)) {
                responseHeaders[key] = value.join(', ');
              }
            }

            log.debug('Local server responded', {
              statusCode: String(proxyRes.statusCode ?? 0),
              bodySize: String(responseBody.length),
            });

            resolve({
              statusCode: proxyRes.statusCode ?? 500,
              headers: responseHeaders,
              body: responseBody.toString('base64'),
            });
          });
        });

        // Connection refused - local server not running
        proxyReq.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'ECONNREFUSED') {
            log.warn('Local server not running', {
              port: String(localPort),
              host: localHost,
            });

            // Return a 502 instead of rejecting - the tunnel stays open
            resolve({
              statusCode: 502,
              headers: { 'content-type': 'text/plain' },
              body: Buffer.from(
                `WorksLocal: localhost:${String(localPort)} is not responding.\n` +
                  `Is your server running? Start it and try again.`,
              ).toString('base64'),
            });
            return;
          }

          log.error('Local proxy error', {
            err: err.message,
            code: err.code ?? 'unknown',
          });
          reject(err);
        });

        // Timeout
        proxyReq.on('timeout', () => {
          proxyReq.destroy();
          resolve({
            statusCode: 504,
            headers: { 'content-type': 'text/plain' },
            body: Buffer.from(
              `WorksLocal: localhost:${String(localPort)} timed out after 30 seconds.`,
            ).toString('base64'),
          });
        });

        // Send request body if present
        if (requestBody && requestBody.length > 0) {
          proxyReq.write(requestBody);
        }
        proxyReq.end();
      });
    },
  };
}
