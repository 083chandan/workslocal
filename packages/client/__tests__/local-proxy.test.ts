import http from 'node:http';

import type { HttpRequestMessage } from '@workslocal/shared';
import { silentLogger } from '@workslocal/shared';
import { makeHttpRequest as _makeHttpRequest } from '@workslocal/test-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createLocalProxy } from '../src/local-proxy.js';

function mockHttpRequest(overrides: Partial<HttpRequestMessage> = {}): HttpRequestMessage {
  return _makeHttpRequest({
    requestId: 'req-123',
    path: '/test',
    ...overrides,
  }) as HttpRequestMessage;
}

// ─── Test HTTP server ────────────────────────────────────

let testServer: http.Server;
let testPort: number;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    testServer = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      const url = new URL(req.url ?? '/', `http://localhost:${String(testPort)}`);

      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');

        if (url.pathname === '/echo') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(
            JSON.stringify({
              method: req.method,
              path: req.url,
              headers: req.headers,
              body,
            }),
          );
          return;
        }

        if (url.pathname === '/slow') {
          return;
        }

        if (url.pathname === '/404') {
          res.writeHead(404, { 'content-type': 'text/plain' });
          res.end('Not found');
          return;
        }

        if (url.pathname === '/500') {
          res.writeHead(500, { 'content-type': 'text/plain' });
          res.end('Server error');
          return;
        }

        res.writeHead(200, { 'content-type': 'text/plain' });
        res.end('ok');
      });
    });

    testServer.listen(0, () => {
      const addr = testServer.address();
      testPort = typeof addr === 'object' && addr ? addr.port : 0;
      resolve();
    });
  });
});

afterAll(() => {
  testServer.close();
});

// ─── Tests ───────────────────────────────────────────────

describe('LocalProxy', () => {
  const proxy = createLocalProxy({ logger: silentLogger });

  describe('successful forwarding', () => {
    it('forwards GET request and returns response', async () => {
      const response = await proxy.forward(
        mockHttpRequest({ method: 'GET', path: '/echo' }),
        testPort,
      );

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const body = JSON.parse(Buffer.from(response.body, 'base64').toString('utf-8')) as {
        method: string;
        path: string;
      };
      expect(body.method).toBe('GET');
      expect(body.path).toBe('/echo');
    });

    it('forwards POST request with body', async () => {
      const requestBody = Buffer.from('{"name":"test"}').toString('base64');

      const response = await proxy.forward(
        mockHttpRequest({
          method: 'POST',
          path: '/echo',
          headers: { 'content-type': 'application/json' },
          body: requestBody,
        }),
        testPort,
      );

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(Buffer.from(response.body, 'base64').toString('utf-8')) as {
        method: string;
        body: string;
      };
      expect(body.method).toBe('POST');
      expect(body.body).toBe('{"name":"test"}');
    });

    it('forwards query parameters in path', async () => {
      const response = await proxy.forward(
        mockHttpRequest({
          path: '/echo',
          query: { foo: 'bar', baz: '123' },
        }),
        testPort,
      );

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(Buffer.from(response.body, 'base64').toString('utf-8')) as {
        path: string;
      };
      expect(body.path).toContain('foo=bar');
      expect(body.path).toContain('baz=123');
    });

    it('preserves response status codes', async () => {
      const r404 = await proxy.forward(mockHttpRequest({ path: '/404' }), testPort);
      expect(r404.statusCode).toBe(404);

      const r500 = await proxy.forward(mockHttpRequest({ path: '/500' }), testPort);
      expect(r500.statusCode).toBe(500);
    });

    it('preserves response headers', async () => {
      const response = await proxy.forward(mockHttpRequest({ path: '/echo' }), testPort);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('returns base64-encoded response body', async () => {
      const response = await proxy.forward(mockHttpRequest({ path: '/' }), testPort);

      const decoded = Buffer.from(response.body, 'base64').toString('utf-8');
      expect(decoded).toBe('ok');
    });
  });

  describe('ECONNREFUSED — local server not running', () => {
    it('returns 502 with friendly message', async () => {
      const unusedPort = 19999;

      const response = await proxy.forward(mockHttpRequest({ path: '/test' }), unusedPort);

      expect(response.statusCode).toBe(502);

      const body = Buffer.from(response.body, 'base64').toString('utf-8');
      expect(body).toContain('not responding');
      expect(body).toContain(String(unusedPort));
    });

    it('does not throw — returns a response', async () => {
      const unusedPort = 19998;

      // Should NOT reject/throw
      const response = await proxy.forward(mockHttpRequest(), unusedPort);

      expect(response).toBeDefined();
      expect(response.statusCode).toBe(502);
    });
  });

  describe('headers', () => {
    it('removes host header from forwarded request', async () => {
      const response = await proxy.forward(
        mockHttpRequest({
          path: '/echo',
          headers: { host: 'myapp.workslocal.exposed', 'x-custom': 'value' },
        }),
        testPort,
      );

      const body = JSON.parse(Buffer.from(response.body, 'base64').toString('utf-8')) as {
        headers: Record<string, string>;
      };

      // host should NOT be the tunnel host
      expect(body.headers['host']).not.toBe('myapp.workslocal.exposed');
      // custom header should pass through
      expect(body.headers['x-custom']).toBe('value');
    });
  });

  describe('concurrency', () => {
    it('handles 10 concurrent requests without errors', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        proxy.forward(
          mockHttpRequest({ path: '/echo', request_id: `concurrent-${String(i)}` }),
          testPort,
        ),
      );
      const responses = await Promise.all(requests);
      expect(responses).toHaveLength(10);
      for (const r of responses) {
        expect(r.statusCode).toBe(200);
      }
    });
  });

  describe('encoding', () => {
    it('preserves query params through forwarding', async () => {
      const response = await proxy.forward(
        mockHttpRequest({ path: '/echo', query: { q: 'hello world', lang: 'en' } }),
        testPort,
      );
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(Buffer.from(response.body, 'base64').toString('utf-8')) as {
        path: string;
      };
      expect(body.path).toContain('q=');
      expect(body.path).toContain('lang=en');
    });
  });
});
