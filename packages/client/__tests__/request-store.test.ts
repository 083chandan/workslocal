import { describe, expect, it } from 'vitest';

import { createRequestStore } from '../src/request-store.js';
import type { CapturedRequest } from '../src/types.js';

function mockRequest(id: string, overrides: Partial<CapturedRequest> = {}): CapturedRequest {
  return {
    requestId: id,
    tunnelId: 'tunnel-1',
    method: 'GET',
    path: '/test',
    query: {},
    requestHeaders: {},
    requestBody: '',
    responseStatusCode: 200,
    responseHeaders: {},
    responseBody: '',
    responseTimeMs: 10,
    timestamp: new Date(),
    ...overrides,
  };
}

describe('RequestStore', () => {
  describe('add + getAll', () => {
    it('stores and retrieves requests newest first', () => {
      const store = createRequestStore({ maxSize: 10 });
      store.add(mockRequest('r1'));
      store.add(mockRequest('r2'));
      store.add(mockRequest('r3'));

      const all = store.getAll();
      expect(all).toHaveLength(3);
      expect(all[0]!.requestId).toBe('r3');
      expect(all[1]!.requestId).toBe('r2');
      expect(all[2]!.requestId).toBe('r1');
    });

    it('returns empty array when no requests', () => {
      const store = createRequestStore();
      expect(store.getAll()).toHaveLength(0);
    });
  });

  describe('ring buffer eviction', () => {
    it('evicts oldest when at capacity', () => {
      const store = createRequestStore({ maxSize: 3 });
      store.add(mockRequest('r1'));
      store.add(mockRequest('r2'));
      store.add(mockRequest('r3'));
      store.add(mockRequest('r4'));

      const all = store.getAll();
      expect(all).toHaveLength(3);
      expect(all.find((r) => r.requestId === 'r1')).toBeUndefined();
      expect(all[0]!.requestId).toBe('r4');
    });

    it('respects maxSize of 1', () => {
      const store = createRequestStore({ maxSize: 1 });
      store.add(mockRequest('r1'));
      store.add(mockRequest('r2'));

      const all = store.getAll();
      expect(all).toHaveLength(1);
      expect(all[0]!.requestId).toBe('r2');
    });

    it('evicts continuously under pressure', () => {
      const store = createRequestStore({ maxSize: 2 });
      for (let i = 0; i < 100; i++) {
        store.add(mockRequest(`r${String(i)}`));
      }

      const all = store.getAll();
      expect(all).toHaveLength(2);
      expect(all[0]!.requestId).toBe('r99');
      expect(all[1]!.requestId).toBe('r98');
    });
  });

  describe('filters', () => {
    it('filters by method', () => {
      const store = createRequestStore();
      store.add(mockRequest('r1', { method: 'GET' }));
      store.add(mockRequest('r2', { method: 'POST' }));
      store.add(mockRequest('r3', { method: 'GET' }));

      const gets = store.getAll({ method: 'GET' });
      expect(gets).toHaveLength(2);
      expect(gets.every((r) => r.method === 'GET')).toBe(true);
    });

    it('filters by method case-insensitively', () => {
      const store = createRequestStore();
      store.add(mockRequest('r1', { method: 'POST' }));

      expect(store.getAll({ method: 'post' })).toHaveLength(1);
      expect(store.getAll({ method: 'POST' })).toHaveLength(1);
    });

    it('filters by minimum status code', () => {
      const store = createRequestStore();
      store.add(mockRequest('r1', { responseStatusCode: 200 }));
      store.add(mockRequest('r2', { responseStatusCode: 404 }));
      store.add(mockRequest('r3', { responseStatusCode: 500 }));

      const errors = store.getAll({ minStatus: 400 });
      expect(errors).toHaveLength(2);
    });

    it('filters by maximum status code', () => {
      const store = createRequestStore();
      store.add(mockRequest('r1', { responseStatusCode: 200 }));
      store.add(mockRequest('r2', { responseStatusCode: 404 }));
      store.add(mockRequest('r3', { responseStatusCode: 500 }));

      const ok = store.getAll({ maxStatus: 299 });
      expect(ok).toHaveLength(1);
      expect(ok[0]!.responseStatusCode).toBe(200);
    });

    it('filters by status range', () => {
      const store = createRequestStore();
      store.add(mockRequest('r1', { responseStatusCode: 200 }));
      store.add(mockRequest('r2', { responseStatusCode: 301 }));
      store.add(mockRequest('r3', { responseStatusCode: 404 }));
      store.add(mockRequest('r4', { responseStatusCode: 500 }));

      const clientErrors = store.getAll({ minStatus: 400, maxStatus: 499 });
      expect(clientErrors).toHaveLength(1);
      expect(clientErrors[0]!.responseStatusCode).toBe(404);
    });

    it('filters by tunnelId', () => {
      const store = createRequestStore();
      store.add(mockRequest('r1', { tunnelId: 'a' }));
      store.add(mockRequest('r2', { tunnelId: 'b' }));
      store.add(mockRequest('r3', { tunnelId: 'a' }));

      const tunnelA = store.getAll({ tunnelId: 'a' });
      expect(tunnelA).toHaveLength(2);
    });

    it('combines multiple filters', () => {
      const store = createRequestStore();
      store.add(mockRequest('r1', { method: 'POST', responseStatusCode: 200 }));
      store.add(mockRequest('r2', { method: 'POST', responseStatusCode: 500 }));
      store.add(mockRequest('r3', { method: 'GET', responseStatusCode: 500 }));

      const postErrors = store.getAll({ method: 'POST', minStatus: 500 });
      expect(postErrors).toHaveLength(1);
      expect(postErrors[0]!.requestId).toBe('r2');
    });

    it('returns empty for no matches', () => {
      const store = createRequestStore();
      store.add(mockRequest('r1', { method: 'GET' }));

      expect(store.getAll({ method: 'DELETE' })).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('finds request by ID', () => {
      const store = createRequestStore();
      store.add(mockRequest('r1'));
      store.add(mockRequest('r2'));

      const found = store.getById('r1');
      expect(found).toBeDefined();
      expect(found!.requestId).toBe('r1');
    });

    it('returns undefined for unknown ID', () => {
      const store = createRequestStore();
      store.add(mockRequest('r1'));

      expect(store.getById('nonexistent')).toBeUndefined();
    });
  });

  describe('size', () => {
    it('tracks current size', () => {
      const store = createRequestStore({ maxSize: 5 });
      expect(store.size).toBe(0);

      store.add(mockRequest('r1'));
      expect(store.size).toBe(1);

      store.add(mockRequest('r2'));
      store.add(mockRequest('r3'));
      expect(store.size).toBe(3);
    });

    it('caps at maxSize', () => {
      const store = createRequestStore({ maxSize: 2 });
      store.add(mockRequest('r1'));
      store.add(mockRequest('r2'));
      store.add(mockRequest('r3'));

      expect(store.size).toBe(2);
    });
  });

  describe('clear', () => {
    it('removes all requests', () => {
      const store = createRequestStore();
      store.add(mockRequest('r1'));
      store.add(mockRequest('r2'));

      store.clear();
      expect(store.size).toBe(0);
      expect(store.getAll()).toHaveLength(0);
    });
  });

  describe('clearTunnel', () => {
    it('removes requests for a specific tunnel', () => {
      const store = createRequestStore();
      store.add(mockRequest('r1', { tunnelId: 'a' }));
      store.add(mockRequest('r2', { tunnelId: 'b' }));
      store.add(mockRequest('r3', { tunnelId: 'a' }));

      store.clearTunnel('a');
      expect(store.size).toBe(1);
      expect(store.getAll()[0]!.tunnelId).toBe('b');
    });

    it('does nothing for unknown tunnel', () => {
      const store = createRequestStore();
      store.add(mockRequest('r1', { tunnelId: 'a' }));

      store.clearTunnel('nonexistent');
      expect(store.size).toBe(1);
    });
  });

  describe('eviction edge cases', () => {
    it('getById returns undefined for evicted request ID', () => {
      const store = createRequestStore({ maxSize: 2 });
      store.add(mockRequest('r1'));
      store.add(mockRequest('r2'));
      store.add(mockRequest('r3'));
      expect(store.getById('r1')).toBeUndefined();
    });

    it('stress: 10000 items into maxSize=100', () => {
      const store = createRequestStore({ maxSize: 100 });
      for (let i = 0; i < 10000; i++) {
        store.add(mockRequest(`r${String(i)}`));
      }
      expect(store.size).toBe(100);
      expect(store.getAll()[0]!.requestId).toBe('r9999');
    });
  });
});
