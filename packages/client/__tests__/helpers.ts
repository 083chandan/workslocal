import { silentLogger } from '@workslocal/shared';
import { vi } from 'vitest';

import type { ClientContext } from '../src/client-context.js';
import type { LocalProxy } from '../src/local-proxy.js';
import { createRequestStore } from '../src/request-store.js';

export function createMockContext(overrides: Partial<ClientContext> = {}): ClientContext {
  return {
    log: silentLogger,
    tunnels: new Map(),
    portMap: new Map(),
    localWebSockets: new Map(),
    localProxy: {
      forward: vi.fn(),
    } as unknown as LocalProxy,
    requestStore: createRequestStore(),
    proxyOverride: undefined,
    pendingPort: null,
    send: vi.fn(),
    emit: vi.fn(),
    ...overrides,
  };
}
