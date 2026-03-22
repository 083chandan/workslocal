import { useState, useEffect } from 'react';

import type { TunnelInfo } from '../types';

export function useTunnelInfo(): TunnelInfo | null {
  const [info, setInfo] = useState<TunnelInfo | null>(null);

  useEffect(() => {
    const fetchInfo = (): void => {
      fetch('/api/tunnel')
        .then((res) => res.json() as Promise<TunnelInfo>)
        .then(setInfo)
        .catch(() => {
          /* retry next interval */
        });
    };

    fetchInfo();
    const interval = setInterval(fetchInfo, 5000);
    return (): void => clearInterval(interval);
  }, []);

  return info;
}
