import { JSX } from 'react';

import type { CapturedRequest } from '../types';

interface RequestListProps {
  requests: CapturedRequest[];
  selected: CapturedRequest | null;
  onSelect: (request: CapturedRequest) => void;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-500',
  POST: 'bg-blue-500/15 text-blue-500',
  PUT: 'bg-amber-500/15 text-amber-500',
  PATCH: 'bg-orange-500/15 text-orange-500',
  DELETE: 'bg-red-500/15 text-red-500',
  HEAD: 'bg-purple-500/15 text-purple-500',
  OPTIONS: 'bg-zinc-500/15 text-zinc-400',
};

function statusColor(code: number): string {
  if (code < 300) return 'text-emerald-500';
  if (code < 400) return 'text-amber-500';
  return 'text-red-500';
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function RequestList({ requests, selected, onSelect }: RequestListProps): JSX.Element {
  return (
    <div className="divide-y divide-(--border)">
      {requests.map((req) => {
        const isSelected = selected?.requestId === req.requestId;
        const methodClass = METHOD_COLORS[req.method] ?? 'bg-zinc-500/15 text-zinc-400';

        return (
          <button
            key={req.requestId}
            onClick={() => onSelect(req)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-(--accent) ${
              isSelected ? 'bg-(--accent)' : ''
            }`}
          >
            {/* Method badge */}
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${methodClass} w-14 shrink-0 text-center`}
            >
              {req.method}
            </span>

            {/* Path */}
            <span className="flex-1 truncate font-mono text-xs text-(--foreground)">
              {req.path}
            </span>

            {/* Status */}
            <span
              className={`shrink-0 font-mono text-xs font-bold ${statusColor(req.responseStatusCode)}`}
            >
              {req.responseStatusCode}
            </span>

            {/* Duration */}
            <span className="w-12 shrink-0 text-right text-[10px] text-(--muted-foreground)">
              {req.responseTimeMs}ms
            </span>

            {/* Timestamp */}
            <span className="shrink-0 text-[10px] text-(--muted-foreground)">
              {formatTime(req.timestamp)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
