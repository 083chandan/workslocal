import { JSX } from 'react';

interface EmptyStateProps {
  mode: 'http' | 'catch';
}

export function EmptyState({ mode }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="text-4xl mb-4">📡</div>
      <h2 className="text-sm font-medium text-(--foreground) mb-2">Waiting for requests...</h2>
      <p className="text-xs text-(--muted-foreground) max-w-xs">
        {mode === 'catch' ? (
          <>
            Paste your tunnel URL in a webhook dashboard (Stripe, GitHub, etc.) and send a test
            event.
          </>
        ) : (
          <>Send a request to your tunnel URL and it will appear here in real time.</>
        )}
      </p>
      <div className="mt-4 px-3 py-2 rounded-md bg-(--muted) text-xs font-mono text-(--muted-foreground)">
        {mode === 'catch'
          ? 'curl -X POST https://your-tunnel.workslocal.exposed/webhook'
          : 'curl https://your-tunnel.workslocal.exposed/'}
      </div>
    </div>
  );
}
