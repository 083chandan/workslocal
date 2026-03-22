import { useState, useEffect, useCallback } from 'react';

import type { CapturedRequest } from '../types';

export function useRequests(): {
  requests: CapturedRequest[];
  isConnected: boolean;
  clear: () => void;
} {
  const [requests, setRequests] = useState<CapturedRequest[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Fetch existing requests
    fetch('/api/requests')
      .then((res) => res.json() as Promise<CapturedRequest[]>)
      .then(setRequests)
      .catch(() => {
        /* CLI not ready */
      });

    // SSE for real-time updates
    const source = new EventSource('/api/events');

    source.onopen = (): void => setIsConnected(true);

    source.onmessage = (event: MessageEvent): void => {
      const req = JSON.parse(event.data as string) as CapturedRequest;
      setRequests((prev) => [req, ...prev]);
    };

    source.onerror = (): void => setIsConnected(false);

    return (): void => source.close();
  }, []);

  const clear = useCallback(() => {
    setRequests([]);
    fetch('/api/requests', { method: 'DELETE' }).catch(() => {
      /* best effort */
    });
  }, []);

  return { requests, isConnected, clear };
}
