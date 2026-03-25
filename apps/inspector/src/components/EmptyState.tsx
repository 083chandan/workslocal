import { JSX } from 'react';

interface EmptyStateProps {
  mode: 'http' | 'catch';
}

export function EmptyState({ mode }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-4xl">📡</div>
      <h2 className="mb-2 text-sm font-medium text-(--foreground)">Waiting for requests...</h2>
      <p className="max-w-xs text-xs text-(--muted-foreground)">
        {mode === 'catch' ? (
          <>
            Paste your tunnel URL in a webhook dashboard (Stripe, GitHub, etc.) and send a test
            event.
          </>
        ) : (
          <>Send a request to your tunnel URL and it will appear here in real time.</>
        )}
      </p>
      <div className="mt-4 rounded-md bg-(--muted) px-3 py-2 font-mono text-xs text-(--muted-foreground)">
        {mode === 'catch'
          ? 'curl -X POST https://your-tunnel.workslocal.exposed/webhook'
          : 'curl https://your-tunnel.workslocal.exposed/'}
      </div>
    </div>
  );
}
