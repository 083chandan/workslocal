// Types
export type {
  User,
  UserCreateInput,
  Tunnel,
  TunnelConfig,
  TunnelDomain,
  TunnelStatus,
  CreateTunnelRequest,
  CreateTunnelResponse,
  ApiKey,
  ApiKeyCreateInput,
  ApiKeyCreateResponse,
  CreateTunnelMessage,
  CloseTunnelMessage,
  HttpResponseMessage,
  PingMessage,
  ClientMessage,
  TunnelCreatedMessage,
  TunnelClosedMessage,
  HttpRequestMessage,
  PongMessage,
  ErrorMessage,
  DomainsUpdatedMessage,
  ServerMessage,
  WebSocketMessage,
  WebSocketMessageType,
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
} from './types/index.js';

// Constants
export {
  TUNNEL_DOMAINS,
  DEFAULT_TUNNEL_DOMAIN,
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_REGEX,
  MAX_TUNNELS_PER_USER,
  MAX_API_KEYS_PER_USER,
  MAX_PAYLOAD_BYTES,
  HEARTBEAT_INTERVAL_MS,
  STALE_THRESHOLD_DAYS,
  SUBDOMAIN_RESERVATION_MS,
  MAX_REQUESTS_PER_TUNNEL,
  API_KEY_PREFIX,
  API_VERSION,
  ANONYMOUS_TUNNEL_TTL_MS,
  AUTH_CACHE_TTL_SECONDS,
  MAX_TUNNELS_ANONYMOUS,
  MAX_TUNNELS_AUTHENTICATED,
} from './constants.js';
export type { TunnelDomainName } from './constants.js';

// Schemas
export {
  subdomainSchema,
  tunnelDomainSchema,
  createTunnelSchema,
  apiKeySchema,
  tunnelConfigSchema,
  // WS message schemas
  createTunnelMessageSchema,
  closeTunnelMessageSchema,
  httpResponseMessageSchema,
  pingMessageSchema,
  clientMessageSchema,
} from './schemas/index.js';

// Errors
export { ErrorCode, errorMessages, AppError } from './errors.js';
export type { ErrorCodeType } from './errors.js';

// Utilities
export {
  validateSubdomain,
  generateRandomSubdomain,
  formatPublicUrl,
  parseHostHeader,
  isValidTunnelDomain,
  getDefaultDomain,
} from './utils/index.js';

export type { WLLogger } from './logger.js';
export { silentLogger, createConsoleLogger } from './logger.js';
