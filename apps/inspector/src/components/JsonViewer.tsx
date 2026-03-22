import { JSX } from 'react';

interface JsonViewerProps {
  content: string;
}

export function JsonViewer({ content }: JsonViewerProps): JSX.Element {
  // Tokenize JSON with regex for coloring
  const highlighted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="text-blue-400">$1</span>:') // keys
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="text-green-400">$1</span>') // string values
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-amber-400">$1</span>') // numbers
    .replace(/:\s*(true|false)/g, ': <span class="text-purple-400">$1</span>') // booleans
    .replace(/:\s*(null)/g, ': <span class="text-zinc-500">$1</span>'); // null

  return (
    <pre className="text-sm font-mono p-4 overflow-x-auto whitespace-pre">
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}
