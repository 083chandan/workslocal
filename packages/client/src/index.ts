// Core client
export { TunnelClient } from './tunnel-client.js';

// Components (for advanced usage)
export { createLocalProxy } from './local-proxy.js';
export type { LocalProxy, LocalProxyResponse } from './local-proxy.js';
export { createRequestStore } from './request-store.js';
export type { RequestStore } from './request-store.js';
export { createInspectorServer } from './inspector-server.js';
export type { InspectorServer } from './inspector-server.js';
export { createCatchProxy } from './catch-proxy.js';
export type { CatchProxy } from './catch-proxy.js';

// Auth
export { getAnonymousToken, clearCredentials } from './auth.js';

// Types
export type {
  ConnectionState,
  TunnelInfo,
  CapturedRequest,
  TunnelClientOptions,
  TunnelClientEvents,
} from './types.js';
