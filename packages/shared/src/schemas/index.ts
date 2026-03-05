import { z } from 'zod';

import { subdomainSchema, tunnelDomainSchema } from './base.js';

export const createTunnelSchema = z.object({
  port: z.number().int().min(1).max(65535),
  subdomain: subdomainSchema.optional(),
  domain: tunnelDomainSchema.optional(),
  localHost: z.string().default('localhost'),
});

export const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
});

export const tunnelConfigSchema = z.object({
  name: z.string().min(1).max(100),
  port: z.number().int().min(1).max(65535),
  subdomain: subdomainSchema.optional(),
  domain: tunnelDomainSchema.optional(),
  localHost: z.string().default('localhost'),
  headers: z.record(z.string(), z.string()).optional(),
});

export {
  createTunnelMessageSchema,
  closeTunnelMessageSchema,
  httpResponseMessageSchema,
  pingMessageSchema,
  clientMessageSchema,
} from './ws.js';

export { subdomainSchema, tunnelDomainSchema } from './base.js';
