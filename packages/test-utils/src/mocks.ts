import { vi } from 'vitest';

/** Returns a WLLogger with vi.fn() stubs for all methods */
export function createMockLogger(): Record<string, ReturnType<typeof vi.fn>> {
  const logger: Record<string, ReturnType<typeof vi.fn>> = {
    fatal: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
  };
  (logger.child as ReturnType<typeof vi.fn>).mockReturnValue(logger);
  return logger;
}
