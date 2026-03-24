import { silentLogger } from '@workslocal/shared';
import { describe, expect, it, vi } from 'vitest';

import { handleMessage } from '../src/handlers/message-handler.js';

import { createMockContext } from './helpers.js';

describe('handleMessage', () => {
  it('tunnel_created: adds tunnel to ctx.tunnels and emits tunnel:created', async () => {
    const ctx = createMockContext({ pendingPort: 3000 });

    const msg = {
      type: 'tunnel_created',
      tunnel_id: 'tun-1',
      public_url: 'https://abc.workslocal.dev',
      subdomain: 'abc',
      domain: 'workslocal.dev',
      expires_at: '2026-12-31T00:00:00Z',
      is_persistent: false,
    };

    await handleMessage(ctx, JSON.stringify(msg));

    expect(ctx.tunnels.has('tun-1')).toBe(true);
    const tunnel = ctx.tunnels.get('tun-1')!;
    expect(tunnel.publicUrl).toBe('https://abc.workslocal.dev');
    expect(tunnel.subdomain).toBe('abc');
    expect(tunnel.localPort).toBe(3000);
    expect(tunnel.isPersistent).toBe(false);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ctx.emit).toHaveBeenCalledWith(
      'tunnel:created',
      expect.objectContaining({ tunnelId: 'tun-1' }),
    );

    // pendingPort should be cleared after tunnel creation
    expect(ctx.pendingPort).toBeNull();
  });

  it('tunnel_closed: removes from tunnels and emits tunnel:closed', async () => {
    const ctx = createMockContext();
    ctx.tunnels.set('tun-1', {
      tunnelId: 'tun-1',
      publicUrl: 'https://abc.workslocal.dev',
      subdomain: 'abc',
      domain: 'workslocal.dev',
      localPort: 3000,
      expiresAt: null,
      isPersistent: false,
      userId: null,
      createdAt: new Date(),
    });
    ctx.portMap.set('tun-1', 3000);

    const msg = {
      type: 'tunnel_closed',
      tunnel_id: 'tun-1',
      reason: 'expired',
    };

    await handleMessage(ctx, JSON.stringify(msg));

    expect(ctx.tunnels.has('tun-1')).toBe(false);
    expect(ctx.portMap.has('tun-1')).toBe(false);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ctx.emit).toHaveBeenCalledWith('tunnel:closed', 'tun-1', 'expired');
  });

  it('error message: emits error event', async () => {
    const ctx = createMockContext();

    const msg = {
      type: 'error',
      code: 'RATE_LIMIT',
      message: 'Too many requests',
    };

    await handleMessage(ctx, JSON.stringify(msg));

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ctx.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message: '[RATE_LIMIT] Too many requests',
      }),
    );
  });

  it('invalid JSON: logs warning and does not throw', async () => {
    const warn = vi.fn();
    const ctx = createMockContext({
      log: { ...silentLogger, warn },
    });

    await expect(handleMessage(ctx, '{{not json}')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith('Invalid JSON from server', expect.any(Object) as object);
  });

  it('unknown message type: handled gracefully without crashing', async () => {
    const warn = vi.fn();
    const ctx = createMockContext({
      log: { ...silentLogger, warn },
    });

    const msg = { type: 'something_unknown', data: 123 };
    await expect(handleMessage(ctx, JSON.stringify(msg))).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith('Unknown message type from server', {
      type: 'something_unknown',
    });
  });
});
