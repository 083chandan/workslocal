import http from 'node:http';

import type { HttpRequestMessage } from '@workslocal/shared';
import { silentLogger } from '@workslocal/shared';
import { makeHttpRequest as _makeHttpRequest } from '@workslocal/test-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createLocalProxy } from '../src/local-proxy.js';

function mockHttpRequest(overrides: Partial<HttpRequestMessage> = {}): HttpRequestMessage {
  return _makeHttpRequest({
    requestId: 'req-edge',
    path: '/echo',
    ...overrides,
  }) as HttpRequestMessage;
}

let testServer: http.Server;
let testPort: number;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    testServer = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        // Echo back request details
        res.writeHead(
          req.method === 'HEAD'
            ? 200
            : req.url === '/redirect'
              ? 301
              : req.url === '/no-content'
                ? 204
                : 200,
          {
            'content-type': 'application/json',
            ...(req.url === '/redirect' ? { location: '/redirected' } : {}),
            ...(req.url === '/set-cookie' ? { 'set-cookie': 'session=abc123' } : {}),
          },
        );
        if (req.method !== 'HEAD' && req.url !== '/no-content') {
          res.end(
            JSON.stringify({
              method: req.method,
              path: req.url,
              headers: req.headers,
              body,
            }),
          );
        } else {
          res.end();
        }
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

const proxy = createLocalProxy({ logger: silentLogger });

describe('body handling', () => {
  it('empty body GET round-trips correctly', async () => {
    const response = await proxy.forward(
      mockHttpRequest({ method: 'GET', path: '/echo', body: '' }),
      testPort,
    );

    expect(response.statusCode).toBe(200);

    const parsed = JSON.parse(Buffer.from(response.body, 'base64').toString('utf-8')) as {
      method: string;
    };
    expect(parsed.method).toBe('GET');
  });

  it('POST with empty string body forwards without error', async () => {
    const response = await proxy.forward(
      mockHttpRequest({ method: 'POST', path: '/echo', body: '' }),
      testPort,
    );

    expect(response.statusCode).toBe(200);

    const parsed = JSON.parse(Buffer.from(response.body, 'base64').toString('utf-8')) as {
      method: string;
    };
    expect(parsed.method).toBe('POST');
  });

  it('binary body is forwarded to localhost', async () => {
    // Base64-encoded body should be decoded and forwarded by the proxy
    const textBody = 'Hello binary world';
    const encodedBody = Buffer.from(textBody).toString('base64');

    const response = await proxy.forward(
      mockHttpRequest({
        method: 'POST',
        path: '/echo',
        headers: { 'content-type': 'application/octet-stream' },
        body: encodedBody,
      }),
      testPort,
    );

    expect(response.statusCode).toBe(200);

    const parsed = JSON.parse(Buffer.from(response.body, 'base64').toString('utf-8')) as {
      body: string;
    };
    // The proxy decodes base64 before forwarding, so the echo server receives raw text
    expect(parsed.body).toBe(textBody);
  });
});

describe('header handling', () => {
  it('50+ custom headers all arrive at localhost', async () => {
    const headers: Record<string, string> = {};
    for (let i = 0; i < 60; i++) {
      headers[`x-header-${String(i)}`] = `value-${String(i)}`;
    }

    const response = await proxy.forward(
      mockHttpRequest({ method: 'GET', path: '/echo', headers }),
      testPort,
    );

    expect(response.statusCode).toBe(200);

    const parsed = JSON.parse(Buffer.from(response.body, 'base64').toString('utf-8')) as {
      headers: Record<string, string>;
    };

    for (let i = 0; i < 60; i++) {
      expect(parsed.headers[`x-header-${String(i)}`]).toBe(`value-${String(i)}`);
    }
  });

  it('Cookie header forwarded intact', async () => {
    const response = await proxy.forward(
      mockHttpRequest({
        method: 'GET',
        path: '/echo',
        headers: { cookie: 'session=abc; theme=dark' },
      }),
      testPort,
    );

    expect(response.statusCode).toBe(200);

    const parsed = JSON.parse(Buffer.from(response.body, 'base64').toString('utf-8')) as {
      headers: Record<string, string>;
    };
    expect(parsed.headers['cookie']).toBe('session=abc; theme=dark');
  });
});

describe('status code edge cases', () => {
  it('HEAD response has empty body', async () => {
    const response = await proxy.forward(
      mockHttpRequest({ method: 'HEAD', path: '/echo' }),
      testPort,
    );

    expect(response.statusCode).toBe(200);

    const decoded = Buffer.from(response.body, 'base64').toString('utf-8');
    expect(decoded).toBe('');
  });

  it('301 redirect not followed, passed through with Location header', async () => {
    const response = await proxy.forward(
      mockHttpRequest({ method: 'GET', path: '/redirect' }),
      testPort,
    );

    expect(response.statusCode).toBe(301);
    expect(response.headers['location']).toBe('/redirected');
  });

  it('204 No Content response has no body', async () => {
    const response = await proxy.forward(
      mockHttpRequest({ method: 'GET', path: '/no-content' }),
      testPort,
    );

    expect(response.statusCode).toBe(204);

    const decoded = Buffer.from(response.body, 'base64').toString('utf-8');
    expect(decoded).toBe('');
  });
});

describe('path handling', () => {
  it('very long URL path (2048 chars) handled without truncation', async () => {
    const longSegment = 'a'.repeat(2048);
    const longPath = `/echo/${longSegment}`;

    const response = await proxy.forward(
      mockHttpRequest({ method: 'GET', path: longPath }),
      testPort,
    );

    expect(response.statusCode).toBe(200);

    const parsed = JSON.parse(Buffer.from(response.body, 'base64').toString('utf-8')) as {
      path: string;
    };
    expect(parsed.path).toContain(longSegment);
  });
});
