/**
 * Decode a base64-encoded body to string.
 */
export function decodeBody(base64: string): string {
  if (!base64) return '';
  try {
    return atob(base64);
  } catch {
    return '[Binary data]';
  }
}

/**
 * Try to parse and pretty-print JSON.
 * Returns null if not valid JSON.
 */
export function tryFormatJson(text: string): string | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return null;
  }
}

/**
 * Detect if a content-type header indicates JSON.
 */
export function isJsonContentType(headers: Record<string, string>): boolean {
  const ct = headers['content-type'] ?? headers['Content-Type'] ?? '';
  return ct.includes('json');
}

/**
 * Format byte size to human-readable.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
