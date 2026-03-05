/**
 * Parse the Host header to extract subdomain and domain.
 * Returns null if not a tunnel request (e.g., api.workslocal.dev).
 *
 * Examples:
 *   "myapp.workslocal.exposed" → { subdomain: "myapp", domain: "workslocal.exposed" }
 *   "api.workslocal.dev" → null (not a tunnel domain)
 *   "workslocal.exposed" → null (no subdomain)
 */
export function parseTunnelHost(
  host: string,
  tunnelDomains: string[],
): { subdomain: string; domain: string } | null {
  // Remove port if present
  const hostname = host.split(':')[0]?.toLowerCase() ?? '';

  for (const domain of tunnelDomains) {
    if (hostname === domain) {
      // Bare domain — no subdomain
      return null;
    }

    if (hostname.endsWith(`.${domain}`)) {
      const subdomain = hostname.slice(0, -(domain.length + 1));

      // Must be a single subdomain level (no dots)
      if (subdomain && !subdomain.includes('.')) {
        return { subdomain, domain };
      }
    }
  }

  return null;
}
