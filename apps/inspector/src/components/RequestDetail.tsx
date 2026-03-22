import { Copy, Check } from 'lucide-react';
import { JSX, useState } from 'react';

import { generateCurl } from '../lib/curl';
import { decodeBody, isJsonContentType, tryFormatJson, formatBytes } from '../lib/format';
import type { CapturedRequest } from '../types';

interface RequestDetailProps {
  request: CapturedRequest;
  tunnelUrl?: string;
}

type Tab = 'request' | 'response' | 'timing';

function statusColor(code: number): string {
  if (code < 300) return 'bg-emerald-500/15 text-emerald-500';
  if (code < 400) return 'bg-amber-500/15 text-amber-500';
  return 'bg-red-500/15 text-red-500';
}

export function RequestDetail({ request, tunnelUrl }: RequestDetailProps): JSX.Element {
  const [tab, setTab] = useState<Tab>('request');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const requestBody = decodeBody(request.requestBody);
  const responseBody = decodeBody(request.responseBody);
  const requestJson = isJsonContentType(request.requestHeaders) ? tryFormatJson(requestBody) : null;
  const responseJson = isJsonContentType(request.responseHeaders)
    ? tryFormatJson(responseBody)
    : null;

  const copyCurl = async (): Promise<void> => {
    const curl = generateCurl(request, tunnelUrl ?? '');
    await navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const copyResponseBody = async (): Promise<void> => {
    await navigator.clipboard.writeText(responseJson ?? responseBody);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'request', label: 'Request' },
    { id: 'response', label: 'Response' },
    { id: 'timing', label: 'Timing' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: method + path + actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--border)">
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 text-xs font-bold font-mono rounded ${statusColor(request.responseStatusCode)}`}
          >
            {request.responseStatusCode}
          </span>
          <span className="text-sm font-bold font-mono">{request.method}</span>
          <span className="text-sm font-mono text-(--muted-foreground) truncate max-w-md">
            {request.path}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy as cURL */}
          <button
            onClick={() => void copyCurl()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-(--muted) hover:bg-(--accent) transition-colors"
          >
            {copiedCurl ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copiedCurl ? 'Copied!' : 'cURL'}
          </button>

          {/* Copy response body */}
          {responseBody && (
            <button
              onClick={() => void copyResponseBody()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-(--muted) hover:bg-(--accent) transition-colors"
            >
              {copiedBody ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copiedBody ? 'Copied!' : 'Body'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-(--border)">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
              tab === t.id
                ? 'border-blue-500 text-(--foreground)'
                : 'border-transparent text-(--muted-foreground) hover:text-(--foreground)'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'request' && (
          <RequestTab
            headers={request.requestHeaders}
            body={requestBody}
            json={requestJson}
            query={request.query}
          />
        )}
        {tab === 'response' && (
          <ResponseTab
            statusCode={request.responseStatusCode}
            headers={request.responseHeaders}
            body={responseBody}
            json={responseJson}
          />
        )}
        {tab === 'timing' && <TimingTab request={request} />}
      </div>
    </div>
  );
}

// ─── Sub-tabs ────────────────────────────────────────────

function RequestTab({
  headers,
  body,
  json,
  query,
}: {
  headers: Record<string, string>;
  body: string;
  json: string | null;
  query: Record<string, string>;
}): JSX.Element {
  const queryEntries = Object.entries(query);

  return (
    <div className="space-y-6">
      {/* Query params */}
      {queryEntries.length > 0 && (
        <Section title="Query Parameters">
          <HeadersTable entries={queryEntries} />
        </Section>
      )}

      {/* Headers */}
      <Section title="Headers">
        <HeadersTable entries={Object.entries(headers)} />
      </Section>

      {/* Body */}
      {body && (
        <Section title={`Body (${formatBytes(body.length)})`}>
          <CodeBlock content={json ?? body} isJson={json !== null} />
        </Section>
      )}
    </div>
  );
}

function ResponseTab({
  statusCode,
  headers,
  body,
  json,
}: {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  json: string | null;
}): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Status */}
      <Section title="Status">
        <span
          className={`px-2 py-1 text-sm font-bold font-mono rounded ${statusColor(statusCode)}`}
        >
          {statusCode}
        </span>
      </Section>

      {/* Headers */}
      <Section title="Headers">
        <HeadersTable entries={Object.entries(headers)} />
      </Section>

      {/* Body */}
      {body && (
        <Section title={`Body (${formatBytes(body.length)})`}>
          <CodeBlock content={json ?? body} isJson={json !== null} />
        </Section>
      )}
    </div>
  );
}

function TimingTab({ request }: { request: CapturedRequest }): JSX.Element {
  const timestamp = new Date(request.timestamp);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-(--muted-foreground) mb-1">Response Time</p>
          <p className="text-2xl font-bold font-mono">{request.responseTimeMs}ms</p>
        </div>
        <div>
          <p className="text-xs text-(--muted-foreground) mb-1">Timestamp</p>
          <p className="text-sm font-mono">{timestamp.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-(--muted-foreground) mb-1">Request Body Size</p>
          <p className="text-sm font-mono">{formatBytes(decodeBody(request.requestBody).length)}</p>
        </div>
        <div>
          <p className="text-xs text-(--muted-foreground) mb-1">Response Body Size</p>
          <p className="text-sm font-mono">
            {formatBytes(decodeBody(request.responseBody).length)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI ───────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <h3 className="text-xs font-medium text-(--muted-foreground) uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function HeadersTable({ entries }: { entries: [string, string][] }): JSX.Element {
  if (entries.length === 0) {
    return <p className="text-xs text-(--muted-foreground)">None</p>;
  }

  return (
    <div className="rounded-md border border-(--border) overflow-hidden">
      <table className="w-full text-xs font-mono">
        <tbody>
          {entries.map(([key, value], i) => (
            <tr key={`${key}-${String(i)}`} className={i % 2 === 0 ? 'bg-(--muted)/30' : ''}>
              <td className="px-3 py-1.5 font-medium text-(--foreground) whitespace-nowrap align-top w-48">
                {key}
              </td>
              <td className="px-3 py-1.5 text-(--muted-foreground) break-all">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ content, isJson }: { content: string; isJson: boolean }): JSX.Element {
  if (isJson) {
    // Simple JSON syntax highlighting via regex
    const highlighted = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(
        /("(?:[^"\\]|\\.)*")\s*:/g,
        '<span style="color:var(--json-key, #93c5fd)">$1</span>:',
      )
      .replace(
        /:\s*("(?:[^"\\]|\\.)*")/g,
        ': <span style="color:var(--json-string, #86efac)">$1</span>',
      )
      .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:var(--json-number, #fbbf24)">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span style="color:var(--json-boolean, #c084fc)">$1</span>')
      .replace(/:\s*(null)/g, ': <span style="color:var(--json-null, #71717a)">$1</span>');

    return (
      <pre className="text-xs font-mono p-3 rounded-md bg-(--muted)/50 overflow-x-auto whitespace-pre border border-(--border)">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    );
  }

  return (
    <pre className="text-xs font-mono p-3 rounded-md bg-(--muted)/50 overflow-x-auto whitespace-pre border border-(--border)">
      {content}
    </pre>
  );
}
