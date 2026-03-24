import type { HttpRequestMessage } from '@workslocal/shared';
import { silentLogger } from '@workslocal/shared';
import { makeHttpRequest as _makeHttpRequest } from '@workslocal/test-utils';
import { describe, expect, it } from 'vitest';

import { createCatchProxy } from '../src/catch-proxy.js';

function mockHttpRequest(overrides: Partial<HttpRequestMessage> = {}): HttpRequestMessage {
  return _makeHttpRequest({
    requestId: 'req-123',
    method: 'POST',
    path: '/webhook',
    headers: { 'content-type': 'application/json' },
    body: Buffer.from('{"test":true}').toString('base64'),
    ...overrides,
  }) as HttpRequestMessage;
}

describe('CatchProxy', () => {
  describe('respond', () => {
    it('returns configured status code', () => {
      const proxy = createCatchProxy({
        statusCode: 200,
        responseBody: '{"ok":true}',
        responseHeaders: {},
        logger: silentLogger,
      });

      const response = proxy.respond(mockHttpRequest());
      expect(response.statusCode).toBe(200);
    });

    it('returns custom status code', () => {
      const proxy = createCatchProxy({
        statusCode: 500,
        responseBody: '{"error":"test"}',
        responseHeaders: {},
        logger: silentLogger,
      });

      const response = proxy.respond(mockHttpRequest());
      expect(response.statusCode).toBe(500);
    });

    it('returns response body as base64', () => {
      const proxy = createCatchProxy({
        statusCode: 200,
        responseBody: '{"ok":true}',
        responseHeaders: {},
        logger: silentLogger,
      });

      const response = proxy.respond(mockHttpRequest());
      const decoded = Buffer.from(response.body, 'base64').toString('utf-8');
      expect(decoded).toBe('{"ok":true}');
    });

    it('returns empty body when no body configured', () => {
      const proxy = createCatchProxy({
        statusCode: 204,
        responseBody: '',
        responseHeaders: {},
        logger: silentLogger,
      });

      const response = proxy.respond(mockHttpRequest());
      const decoded = Buffer.from(response.body, 'base64').toString('utf-8');
      expect(decoded).toBe('');
    });

    it('includes x-workslocal-mode header', () => {
      const proxy = createCatchProxy({
        statusCode: 200,
        responseBody: '',
        responseHeaders: {},
        logger: silentLogger,
      });

      const response = proxy.respond(mockHttpRequest());
      expect(response.headers['x-workslocal-mode']).toBe('catch');
    });

    it('includes content-type header', () => {
      const proxy = createCatchProxy({
        statusCode: 200,
        responseBody: '{"ok":true}',
        responseHeaders: {},
        logger: silentLogger,
      });

      const response = proxy.respond(mockHttpRequest());
      expect(response.headers['content-type']).toBe('application/json');
    });

    it('merges custom response headers', () => {
      const proxy = createCatchProxy({
        statusCode: 200,
        responseBody: '',
        responseHeaders: { 'x-custom': 'value', 'x-another': 'test' },
        logger: silentLogger,
      });

      const response = proxy.respond(mockHttpRequest());
      expect(response.headers['x-custom']).toBe('value');
      expect(response.headers['x-another']).toBe('test');
    });

    it('returns same response regardless of request method', () => {
      const proxy = createCatchProxy({
        statusCode: 200,
        responseBody: '{"ok":true}',
        responseHeaders: {},
        logger: silentLogger,
      });

      const getResponse = proxy.respond(mockHttpRequest({ method: 'GET' }));
      const postResponse = proxy.respond(mockHttpRequest({ method: 'POST' }));
      const deleteResponse = proxy.respond(mockHttpRequest({ method: 'DELETE' }));

      expect(getResponse.statusCode).toBe(200);
      expect(postResponse.statusCode).toBe(200);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('returns same response regardless of request path', () => {
      const proxy = createCatchProxy({
        statusCode: 200,
        responseBody: '{"ok":true}',
        responseHeaders: {},
        logger: silentLogger,
      });

      const r1 = proxy.respond(mockHttpRequest({ path: '/webhook' }));
      const r2 = proxy.respond(mockHttpRequest({ path: '/api/test' }));
      const r3 = proxy.respond(mockHttpRequest({ path: '/' }));

      expect(r1.statusCode).toBe(200);
      expect(r2.statusCode).toBe(200);
      expect(r3.statusCode).toBe(200);
    });
  });

  describe('method handling', () => {
    it('returns same response for all HTTP methods', () => {
      const proxy = createCatchProxy({
        statusCode: 200,
        responseBody: 'ok',
        responseHeaders: {},
        logger: silentLogger,
      });

      for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']) {
        const response = proxy.respond(mockHttpRequest({ method }));
        expect(response.statusCode).toBe(200);
      }
    });
  });

  describe('large payloads', () => {
    it('handles 5MB request body without crashing', () => {
      const proxy = createCatchProxy({
        statusCode: 200,
        responseBody: '',
        responseHeaders: {},
        logger: silentLogger,
      });

      const largeBody = Buffer.from('x'.repeat(5 * 1024 * 1024)).toString('base64');
      expect(() => proxy.respond(mockHttpRequest({ body: largeBody }))).not.toThrow();
    });
  });
});
