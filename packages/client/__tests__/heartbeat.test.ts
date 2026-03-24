import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WebSocket } from 'ws';

import { startHeartbeat, stopHeartbeat } from '../src/connection/heartbeat.js';

const HEARTBEAT_INTERVAL_MS = 30_000;

describe('heartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls send() with {type: "ping", timestamp} after HEARTBEAT_INTERVAL_MS', () => {
    const send = vi.fn();
    const ws = { readyState: 1 }; // WebSocket.OPEN = 1
    const wsGetter = (): WebSocket | null => ws as unknown as WebSocket;

    const timer = startHeartbeat(send, wsGetter);

    expect(send).not.toHaveBeenCalled();

    vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({
      type: 'ping',
      timestamp: expect.any(Number) as number,
    });

    stopHeartbeat(timer);
  });

  it('does not call send() when WebSocket is not in OPEN state', () => {
    const send = vi.fn();
    const ws = { readyState: 3 }; // CLOSED
    const wsGetter = (): WebSocket | null => ws as unknown as WebSocket;

    const timer = startHeartbeat(send, wsGetter);

    vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);

    expect(send).not.toHaveBeenCalled();

    stopHeartbeat(timer);
  });

  it('does not call send() when wsGetter returns null', () => {
    const send = vi.fn();
    const wsGetter = (): WebSocket | null => null;

    const timer = startHeartbeat(send, wsGetter);

    vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);

    expect(send).not.toHaveBeenCalled();

    stopHeartbeat(timer);
  });

  it('stopHeartbeat() clears interval so no more pings fire', () => {
    const send = vi.fn();
    const ws = { readyState: 1 };
    const wsGetter = (): WebSocket | null => ws as unknown as WebSocket;

    const timer = startHeartbeat(send, wsGetter);

    vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);
    expect(send).toHaveBeenCalledTimes(1);

    stopHeartbeat(timer);

    vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 3);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('stopHeartbeat(null) is a no-op and does not throw', () => {
    expect(() => stopHeartbeat(null)).not.toThrow();
  });
});
