import {
  DEFAULT_TUNNEL_DOMAIN,
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_REGEX,
  TUNNEL_DOMAINS,
} from '../constants.js';
import type { TunnelDomainName } from '../constants.js';

export function validateSubdomain(subdomain: string): string | null {
  if (subdomain.length < 1) return 'Subdomain must be at least 1 character';
  if (subdomain.length > 50) return 'Subdomain must be at most 50 characters';
  if (!SUBDOMAIN_REGEX.test(subdomain))
    return 'Subdomain must be lowercase alphanumeric with optional hyphens, no leading/trailing hyphens';
  if ((RESERVED_SUBDOMAINS as readonly string[]).includes(subdomain))
    return 'Subdomain is reserved';
  return null;
}

export function generateRandomSubdomain(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function formatPublicUrl(subdomain: string, domain: string): string {
  return `https://${subdomain}.${domain}`;
}

export function parseHostHeader(
  host: string,
): { subdomain: string; domain: TunnelDomainName } | null {
  const hostname = host.split(':')[0] ?? '';
  for (const tunnelDomain of TUNNEL_DOMAINS) {
    if (hostname.endsWith(`.${tunnelDomain}`)) {
      const subdomain = hostname.slice(0, -(tunnelDomain.length + 1));
      if (subdomain.length > 0 && !subdomain.includes('.')) {
        return { subdomain, domain: tunnelDomain };
      }
    }
  }
  return null;
}

export function isValidTunnelDomain(domain: string): domain is TunnelDomainName {
  return (TUNNEL_DOMAINS as readonly string[]).includes(domain);
}

export function getDefaultDomain(): TunnelDomainName {
  return DEFAULT_TUNNEL_DOMAIN;
}
