import { Check, Copy, Moon, Sun, Trash2 } from 'lucide-react';
import { JSX, useState } from 'react';

import type { TunnelInfo } from '../types';

interface HeaderProps {
  tunnelInfo: TunnelInfo | null;
  isConnected: boolean;
  requestCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onClear: () => void;
}

export function Header({
  tunnelInfo,
  isConnected,
  requestCount,
  theme,
  onToggleTheme,
  onClear,
}: HeaderProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  const copyUrl = async (): Promise<void> => {
    if (!tunnelInfo?.publicUrl) return;
    await navigator.clipboard.writeText(tunnelInfo.publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="flex items-center justify-between border-b border-(--border) bg-(--muted)/30 px-4 py-2.5">
      {/* Left: Logo + tunnel info */}
      <div className="flex items-center gap-4">
        <img
          src={theme === 'dark' ? '/logo-light.svg' : '/logo-dark.svg'}
          alt="WorksLocal"
          className="h-5 w-5"
        />
        <h1 className="text-sm font-bold tracking-tight">WorksLocal</h1>

        {/* Connection dot */}
        <div className="flex items-center gap-1.5">
          <div
            className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}
          />
          <span className="text-xs text-(--muted-foreground)">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Mode badge */}
        {tunnelInfo && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              tunnelInfo.mode === 'catch'
                ? 'bg-amber-500/15 text-amber-500'
                : 'bg-blue-500/15 text-blue-500'
            }`}
          >
            {tunnelInfo.mode.toUpperCase()}
          </span>
        )}

        {/* Public URL (click to copy) */}
        {tunnelInfo?.publicUrl && (
          <button
            onClick={() => void copyUrl()}
            className="flex items-center gap-1.5 font-mono text-xs text-(--muted-foreground) transition-colors hover:text-(--foreground)"
          >
            {tunnelInfo.publicUrl}
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Request count */}
        <span className="text-xs text-(--muted-foreground)">
          {requestCount} request{requestCount !== 1 ? 's' : ''}
        </span>

        {/* Clear button */}
        <button
          onClick={onClear}
          className="rounded-md p-1.5 text-(--muted-foreground) transition-colors hover:bg-(--accent) hover:text-(--foreground)"
          title="Clear requests"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="rounded-md p-1.5 text-(--muted-foreground) transition-colors hover:bg-(--accent) hover:text-(--foreground)"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
      </div>
    </header>
  );
}
