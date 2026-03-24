import { describe, expect, it } from 'vitest';

import { generateCurl } from '../lib/curl';
import type { CapturedRequest } from '../types';

function mockCapturedRequest(overrides: Partial<CapturedRequest> = {}): CapturedRequest {
  return {
    requestId: 'req-1',
    tunnelId: 'tun-1',
    method: 'GET',
    path: '/api/test',
    query: {},
    requestHeaders: { 'content-type': 'application/json' },
    requestBody: '',
    responseStatusCode: 200,
    responseHeaders: {},
    responseBody: '',
    responseTimeMs: 10,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

const tunnelUrl = 'https://myapp.workslocal.exposed';

// ---- generateCurl -- create curl command from captured request ----

describe('generateCurl', () => {
  it('GET request produces curl without -X flag', () => {
    const curl = generateCurl(mockCapturedRequest({ method: 'GET' }), tunnelUrl);
    expect(curl).not.toContain('-X');
    expect(curl).toContain('curl');
    expect(curl).toContain(tunnelUrl);
  });

  it('POST request includes -X POST', () => {
    const curl = generateCurl(mockCapturedRequest({ method: 'POST' }), tunnelUrl);
    expect(curl).toContain('-X POST');
  });

  it('includes -H flags for request headers, skipping host/content-length/connection', () => {
    const req = mockCapturedRequest({
      requestHeaders: {
        host: 'myapp.workslocal.exposed',
        'content-type': 'application/json',
        'x-custom': 'value',
        'content-length': '42',
        connection: 'keep-alive',
      },
    });
    const curl = generateCurl(req, tunnelUrl);
    expect(curl).toContain("-H 'content-type: application/json'");
    expect(curl).toContain("-H 'x-custom: value'");
    expect(curl).not.toContain('host:');
    expect(curl).not.toContain('content-length:');
    expect(curl).not.toContain('connection:');
  });

  it('includes -d flag with decoded body for POST', () => {
    const req = mockCapturedRequest({
      method: 'POST',
      requestBody: btoa('{"name":"test"}'),
    });
    const curl = generateCurl(req, tunnelUrl);
    expect(curl).toContain('-d');
    expect(curl).toContain('{"name":"test"}');
  });

  it('omits -d flag when body is empty', () => {
    const req = mockCapturedRequest({ requestBody: '' });
    const curl = generateCurl(req, tunnelUrl);
    expect(curl).not.toContain('-d');
  });

  it('includes query parameters in the URL', () => {
    const req = mockCapturedRequest({
      query: { q: 'hello', page: '1' },
    });
    const curl = generateCurl(req, tunnelUrl);
    expect(curl).toContain('q=hello');
    expect(curl).toContain('page=1');
  });
});
