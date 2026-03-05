import { z } from 'zod';

import { SUBDOMAIN_REGEX, TUNNEL_DOMAINS } from '../constants.js';

export const subdomainSchema = z
  .string()
  .min(1, 'Subdomain must be at least 1 character')
  .max(50, 'Subdomain must be at most 50 characters')
  .regex(SUBDOMAIN_REGEX, 'Subdomain must be lowercase alphanumeric with optional hyphens');

export const tunnelDomainSchema = z.enum(TUNNEL_DOMAINS);
