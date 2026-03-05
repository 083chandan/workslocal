/**
 * Resolve the relay server WebSocket URL.
 *
 * Priority:
 * 1. --server flag (explicit override)
 * 2. WORKSLOCAL_SERVER_URL environment variable
 * 3. Default: wss://api.workslocal.dev/ws (production)
 *
 * For local development: WORKSLOCAL_SERVER_URL=ws://localhost:3000/ws
 */
export function getServerUrl(flagValue?: string): string {
  if (flagValue) return flagValue;

  const envUrl = process.env['WORKSLOCAL_SERVER_URL'];
  if (envUrl) return envUrl;

  return 'wss://api.workslocal.dev/ws';
}
