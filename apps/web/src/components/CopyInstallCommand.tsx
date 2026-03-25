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
      className="group inline-flex cursor-pointer items-center gap-4 border border-outline bg-surface p-2 transition-colors hover:border-primary"
      onClick={handleCopy}
    >
      <div className="flex items-center gap-3 border border-outline bg-background px-4 py-2">
        <span className="font-mono text-success">$</span>
        <code className="font-mono text-on-background">npm i -g workslocal</code>
      </div>
      <button
        className={`flex cursor-pointer items-center gap-2 pr-4 font-mono text-xs uppercase transition-colors ${copied ? 'text-success' : 'text-muted group-hover:text-primary'}`}
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
