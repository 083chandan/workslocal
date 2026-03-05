import { MAX_REQUESTS_PER_TUNNEL } from '@workslocal/shared';

import type { CapturedRequest } from './types.js';

interface RequestStoreOptions {
  maxSize?: number | undefined;
}

export interface RequestStore {
  add(request: CapturedRequest): void;
  getAll(filters?: {
    tunnelId?: string;
    method?: string;
    minStatus?: number;
    maxStatus?: number;
  }): readonly CapturedRequest[];
  getById(requestId: string): CapturedRequest | undefined;
  readonly size: number;
  clear(): void;
  clearTunnel(tunnelId: string): void;
}

/**
 * Ring buffer that stores captured request/response pairs.
 *
 * Fixed size (default 1000 per tunnel). When full, oldest entries are evicted.
 * The CLI reads from this to print the live request log.
 * The web inspector will query this via a local API.
 */
export function createRequestStore(options?: RequestStoreOptions): RequestStore {
  const maxSize = options?.maxSize ?? MAX_REQUESTS_PER_TUNNEL;
  const requests: CapturedRequest[] = [];

  return {
    /**
     * Add a captured request. Evicts oldest if at capacity.
     */
    add(request: CapturedRequest): void {
      if (requests.length >= maxSize) {
        requests.shift(); // remove oldest
      }
      requests.push(request);
    },

    /**
     * Get all captured requests, newest first.
     * Optional filters by tunnel, method, or status code range.
     */
    getAll(filters?: {
      tunnelId?: string;
      method?: string;
      minStatus?: number;
      maxStatus?: number;
    }): readonly CapturedRequest[] {
      let result = [...requests].reverse(); // newest first

      if (filters?.tunnelId) {
        result = result.filter((r) => r.tunnelId === filters.tunnelId);
      }
      if (filters?.method) {
        result = result.filter((r) => r.method.toUpperCase() === filters.method?.toUpperCase());
      }
      if (filters?.minStatus !== undefined) {
        result = result.filter((r) => r.responseStatusCode >= (filters.minStatus ?? 0));
      }
      if (filters?.maxStatus !== undefined) {
        result = result.filter((r) => r.responseStatusCode <= (filters.maxStatus ?? 599));
      }

      return result;
    },

    /**
     * Get a single request by ID.
     */
    getById(requestId: string): CapturedRequest | undefined {
      return requests.find((r) => r.requestId === requestId);
    },

    /** Total captured requests */
    get size(): number {
      return requests.length;
    },

    /** Clear all stored requests */
    clear(): void {
      requests.length = 0;
    },

    /** Clear requests for a specific tunnel */
    clearTunnel(tunnelId: string): void {
      for (let i = requests.length - 1; i >= 0; i--) {
        if (requests[i]?.tunnelId === tunnelId) {
          requests.splice(i, 1);
        }
      }
    },
  };
}
