import { z } from 'zod';

import { subdomainSchema, tunnelDomainSchema } from './base.js';

export const createTunnelMessageSchema = z.object({
  type: z.literal('create_tunnel'),
  local_port: z.number().int().min(1).max(65535),
  custom_name: subdomainSchema.optional(),
  domain: tunnelDomainSchema.optional(),
  client_version: z.string().min(1),
  anonymous_token: z.string().min(1).optional(),
});

export const closeTunnelMessageSchema = z.object({
  type: z.literal('close_tunnel'),
  tunnel_id: z.string().min(1),
});

export const httpResponseMessageSchema = z.object({
  type: z.literal('http_response'),
  request_id: z.string().min(1),
  status_code: z.number().int().min(100).max(599),
  headers: z.record(z.string(), z.string()),
  body: z.string(),
});

export const pingMessageSchema = z.object({
  type: z.literal('ping'),
  timestamp: z.number(),
});

/**
 * Discriminated union for all client → server messages.
 *
 * After safeParse, switch (msg.type) gives full type narrowing
 * in each case branch. Adding a new message type without handling
 * it causes a TypeScript exhaustive check error.
 */
export const clientMessageSchema = z.discriminatedUnion('type', [
  createTunnelMessageSchema,
  closeTunnelMessageSchema,
  httpResponseMessageSchema,
  pingMessageSchema,
]);
