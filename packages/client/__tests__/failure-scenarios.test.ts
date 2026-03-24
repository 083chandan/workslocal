import http from 'node:http';

import type { HttpRequestMessage } from '@workslocal/shared';
import { silentLogger } from '@workslocal/shared';
import { makeHttpRequest as _makeHttpRequest } from '@workslocal/test-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createLocalProxy } from '../src/local-proxy.js';

function mockHttpRequest(overrides: Partial<HttpRequestMessage> = {}): HttpRequestMessage {
  return _makeHttpRequest({
    requestId: 'req-fail',
    path: '/test',
    ...overrides,
  }) as HttpRequestMessage;
}

const proxy = createLocalProxy({ logger: silentLogger });

describe('502 when localhost not running', () => {
  it('returns 502 for a port with no server', async () => {
    const response = await proxy.forward(mockHttpRequest(), 19997);

    expect(response.statusCode).toBe(502);

    const body = Buffer.from(response.body, 'base64').toString('utf-8');
    expect(body).toContain('not responding');
    expect(body).toContain('19997');
  });
});

describe('504 or error when localhost hangs', () => {
  let hangServer: http.Server;
  let hangPort: number;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      // Server that accepts connections but never sends a response
      hangServer = http.createServer((_req, _res) => {
        // Intentionally do nothing -- simulate a hanging server
      });
      hangServer.listen(0, () => {
        const addr = hangServer.address();
        hangPort = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  afterAll(() => {
    hangServer.close();
  });

  it('receives a response instead of hanging indefinitely', async () => {
    // The proxy has a 30s timeout, but we just verify it does not hang forever.
    // Use a shorter timeout on the test side to avoid waiting the full 30s in CI.
    const response = await proxy.forward(mockHttpRequest(), hangPort);

    // The proxy should eventually resolve with a timeout status (504)
    // or some error status rather than hanging.
    expect(response).toBeDefined();
    expect(typeof response.statusCode).toBe('number');
  }, 35_000);
});

describe('connection reset mid-response', () => {
  let resetServer: http.Server;
  let resetPort: number;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      // Server that writes a partial response then destroys the socket
      resetServer = http.createServer((req, res) => {
        res.writeHead(200, { 'content-type': 'text/plain' });
        res.write('partial data');
        // Destroy the socket abruptly to simulate a connection reset
        req.socket.destroy();
      });
      resetServer.listen(0, () => {
        const addr = resetServer.address();
        resetPort = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  afterAll(() => {
    resetServer.close();
  });

  it('proxy returns a response without crashing', async () => {
    // The proxy should handle the abrupt socket close gracefully.
    // It may resolve with partial data or reject, but must not crash the process.
    let response;
    let caughtError: unknown;

    try {
      response = await proxy.forward(mockHttpRequest(), resetPort);
    } catch (err) {
      caughtError = err;
    }

    // Either a resolved response or a caught error is acceptable --
    // the key invariant is that the proxy does not crash.
    if (response) {
      expect(typeof response.statusCode).toBe('number');
    } else {
      expect(caughtError).toBeDefined();
    }
  });
});
