import { describe, expect, it } from 'vitest';

import { getHttpBaseUrl } from '../src/lib/api.js';

// ---- getHttpBaseUrl -- WebSocket URL to HTTP URL conversion ----

describe('getHttpBaseUrl', () => {
  it('converts wss:// to https:// and strips /ws path', () => {
    expect(getHttpBaseUrl('wss://api.workslocal.dev/ws')).toBe('https://api.workslocal.dev');
  });

  it('converts ws:// to http:// and strips /ws path', () => {
    expect(getHttpBaseUrl('ws://localhost:8787/ws')).toBe('http://localhost:8787');
  });

  it('preserves port number in conversion', () => {
    expect(getHttpBaseUrl('wss://api.example.com:443/ws')).toBe('https://api.example.com:443');
  });

  it('handles URL without /ws suffix', () => {
    expect(getHttpBaseUrl('wss://api.workslocal.dev')).toBe('https://api.workslocal.dev');
  });
});
