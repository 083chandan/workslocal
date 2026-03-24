import type { HttpRequestMessage } from '@workslocal/shared';
import { describe, expect, it, vi } from 'vitest';

import { handleHttpRequest } from '../src/handlers/http-handler.js';
import type { LocalProxy } from '../src/local-proxy.js';

import { createMockContext } from './helpers.js';

function createHttpRequestMessage(overrides: Partial<HttpRequestMessage> = {}): HttpRequestMessage {
  return {
    type: 'http_request',
    request_id: 'req-1',
    method: 'GET',
    path: '/hello',
    headers: { host: 'abc.workslocal.dev' },
    body: '',
    query: {},
    ...overrides,
  };
}

const mockResponse = {
  statusCode: 200,
  headers: { 'content-type': 'application/json' },
  body: Buffer.from('{"ok":true}').toString('base64'),
};

describe('handleHttpRequest', () => {
  it('with proxyOverride set: calls proxyOverride, not localProxy.forward', async () => {
    const proxyOverride = vi.fn().mockResolvedValue(mockResponse);
    const forward = vi.fn();
    const ctx = createMockContext({
      proxyOverride,
      localProxy: { forward } as unknown as LocalProxy,
      portMap: new Map([['tun-1', 3000]]),
    });

    const msg = createHttpRequestMessage();
    await handleHttpRequest(ctx, msg);

    expect(proxyOverride).toHaveBeenCalledWith(msg);
    expect(forward).not.toHaveBeenCalled();
  });

  it('with portMap entry: calls localProxy.forward with correct port', async () => {
    const forward = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createMockContext({
      localProxy: { forward } as unknown as LocalProxy,
      portMap: new Map([['tun-1', 4000]]),
    });

    const msg = createHttpRequestMessage();
    await handleHttpRequest(ctx, msg);

    expect(forward).toHaveBeenCalledWith(msg, 4000);
  });

  it('emits request:start and request:complete events', async () => {
    const forward = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createMockContext({
      localProxy: { forward } as unknown as LocalProxy,
      portMap: new Map([['tun-1', 3000]]),
    });

    const msg = createHttpRequestMessage({ request_id: 'req-42', method: 'POST', path: '/api' });
    await handleHttpRequest(ctx, msg);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ctx.emit).toHaveBeenCalledWith('request:start', 'req-42', 'POST', '/api');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ctx.emit).toHaveBeenCalledWith(
      'request:complete',
      expect.objectContaining({
        requestId: 'req-42',
        method: 'POST',
        path: '/api',
        responseStatusCode: 200,
      }),
    );
  });

  it('sends http_response via ctx.send', async () => {
    const forward = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createMockContext({
      localProxy: { forward } as unknown as LocalProxy,
      portMap: new Map([['tun-1', 3000]]),
    });

    const msg = createHttpRequestMessage({ request_id: 'req-99' });
    await handleHttpRequest(ctx, msg);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ctx.send).toHaveBeenCalledWith({
      type: 'http_response',
      request_id: 'req-99',
      status_code: 200,
      headers: mockResponse.headers,
      body: mockResponse.body,
    });
  });

  it('sends 502 when no tunnel and no proxyOverride', async () => {
    const ctx = createMockContext(); // empty portMap, no proxyOverride

    const msg = createHttpRequestMessage({ request_id: 'req-no-tunnel' });
    await handleHttpRequest(ctx, msg);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ctx.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'http_response',
        request_id: 'req-no-tunnel',
        status_code: 502,
      }),
    );
  });

  it('sends 502 and emits request:error when localProxy.forward throws', async () => {
    const forward = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const ctx = createMockContext({
      localProxy: { forward } as unknown as LocalProxy,
      portMap: new Map([['tun-1', 3000]]),
    });

    const msg = createHttpRequestMessage({ request_id: 'req-err' });
    await handleHttpRequest(ctx, msg);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ctx.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'http_response',
        request_id: 'req-err',
        status_code: 502,
      }),
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ctx.emit).toHaveBeenCalledWith('request:error', 'req-err', 'ECONNREFUSED');
  });
});
