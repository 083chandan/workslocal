/**
 * Generate a cuid-like ID.
 * Uses crypto.randomUUID() which is available in Workers runtime.
 * Format: 26-char lowercase alphanumeric (similar to cuid).
 */
export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 26);
}
