'use client';

import { useState } from 'react';

const CopyInstallCommand = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText('npm i -g workslocal');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="group inline-flex cursor-pointer items-center gap-2 border border-outline bg-surface p-1.5 transition-colors hover:border-primary sm:gap-4 sm:p-2"
      onClick={handleCopy}
    >
      <div className="flex items-center gap-2 border border-outline bg-background px-3 py-1.5 sm:gap-3 sm:px-4 sm:py-2">
        <span className="font-mono text-success">$</span>
        <code className="font-mono text-xs text-on-background sm:text-sm">npm i -g workslocal</code>
      </div>
      <button
        className={`flex cursor-pointer items-center gap-1.5 pr-2 font-mono text-xs uppercase transition-colors sm:gap-2 sm:pr-4 ${copied ? 'text-success' : 'text-muted group-hover:text-primary'}`}
      >
        <span className="material-symbols-outlined text-sm">
          {copied ? 'check' : 'content_copy'}
        </span>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
};

export default CopyInstallCommand;
