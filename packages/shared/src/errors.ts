export const ErrorCode = {
  AUTH_FAILED: 'AUTH_FAILED',
  SUBDOMAIN_TAKEN: 'SUBDOMAIN_TAKEN',
  SUBDOMAIN_INVALID: 'SUBDOMAIN_INVALID',
  SUBDOMAIN_RESERVED: 'SUBDOMAIN_RESERVED',
  DOMAIN_INVALID: 'DOMAIN_INVALID',
  RATE_LIMITED: 'RATE_LIMITED',
  TUNNEL_NOT_FOUND: 'TUNNEL_NOT_FOUND',
  MAX_TUNNELS_REACHED: 'MAX_TUNNELS_REACHED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  TUNNEL_EXPIRED: 'TUNNEL_EXPIRED',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Default message and HTTP status for each error code.
 * AppError uses these when no custom message is provided.
 */
export const errorMessages: Record<ErrorCodeType, { message: string; statusCode: number }> = {
  AUTH_FAILED: { message: 'Authentication failed', statusCode: 401 },
  SUBDOMAIN_TAKEN: { message: 'Subdomain is already in use', statusCode: 409 },
  SUBDOMAIN_INVALID: { message: 'Invalid subdomain format', statusCode: 400 },
  SUBDOMAIN_RESERVED: { message: 'Subdomain is reserved', statusCode: 403 },
  DOMAIN_INVALID: { message: 'Invalid tunnel domain', statusCode: 400 },
  RATE_LIMITED: { message: 'Rate limit exceeded', statusCode: 429 },
  TUNNEL_NOT_FOUND: { message: 'Tunnel not found', statusCode: 404 },
  MAX_TUNNELS_REACHED: { message: 'Maximum tunnel limit reached', statusCode: 403 },
  PAYLOAD_TOO_LARGE: { message: 'Payload exceeds maximum size', statusCode: 413 },
  TUNNEL_EXPIRED: { message: 'Tunnel has expired', statusCode: 410 },
  CONNECTION_TIMEOUT: { message: 'Connection timed out', statusCode: 504 },
  SERVER_ERROR: { message: 'Internal server error', statusCode: 500 },
  INVALID_MESSAGE: { message: 'Invalid WebSocket message', statusCode: 400 },
  VALIDATION_ERROR: { message: 'Validation error', statusCode: 400 },
  NOT_IMPLEMENTED: { message: 'Not implemented', statusCode: 501 },
};

export class AppError extends Error {
  readonly code: ErrorCodeType;
  readonly statusCode: number;
  readonly details?: unknown;
  readonly isOperational = true;

  /**
   * @param code     - Error code from ErrorCode (e.g., 'SUBDOMAIN_TAKEN')
   * @param message  - Optional custom message. Falls back to default from errorMessages.
   * @param details  - Optional additional context for debugging.
   */
  constructor(code: ErrorCodeType, message?: string, details?: unknown) {
    const defaults = errorMessages[code];
    super(message ?? defaults.message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = defaults.statusCode;
    this.details = details;
  }

  toJSON(): { ok: false; error: { code: string; message: string } } {
    return {
      ok: false as const,
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }

  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}
