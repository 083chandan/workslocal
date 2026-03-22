import { Copy, Check } from 'lucide-react';
import { JSX, useState } from 'react';

import { generateCurl } from '../lib/curl';
import type { CapturedRequest } from '../types';

interface CopyAsCurlProps {
  request: CapturedRequest;
  tunnelUrl: string;
}

export function CopyAsCurl({ request, tunnelUrl }: CopyAsCurlProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    const curl = generateCurl(request, tunnelUrl);
    await navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={() => void handleCopy()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                 bg-(--muted) hover:bg-(--accent) transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy as cURL'}
    </button>
  );
}
