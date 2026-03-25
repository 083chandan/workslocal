import { Check, Copy } from 'lucide-react';
import { JSX, useState } from 'react';

import { generateCurl } from '../lib/curl';
import { decodeBody, formatBytes, isJsonContentType, tryFormatJson } from '../lib/format';
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
    <div className="flex h-full flex-col">
      {/* Top bar: method + path + actions */}
      <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${statusColor(request.responseStatusCode)}`}
          >
            {request.responseStatusCode}
          </span>
          <span className="font-mono text-sm font-bold">{request.method}</span>
          <span className="max-w-md truncate font-mono text-sm text-(--muted-foreground)">
            {request.path}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy as cURL */}
          <button
            onClick={() => void copyCurl()}
            className="inline-flex items-center gap-1.5 rounded-md bg-(--muted) px-2.5 py-1 text-xs font-medium transition-colors hover:bg-(--accent)"
          >
            {copiedCurl ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copiedCurl ? 'Copied!' : 'cURL'}
          </button>

          {/* Copy response body */}
          {responseBody && (
            <button
              onClick={() => void copyResponseBody()}
              className="inline-flex items-center gap-1.5 rounded-md bg-(--muted) px-2.5 py-1 text-xs font-medium transition-colors hover:bg-(--accent)"
            >
              {copiedBody ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
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
            className={`border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
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
          className={`rounded px-2 py-1 font-mono text-sm font-bold ${statusColor(statusCode)}`}
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
          <p className="mb-1 text-xs text-(--muted-foreground)">Response Time</p>
          <p className="font-mono text-2xl font-bold">{request.responseTimeMs}ms</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-(--muted-foreground)">Timestamp</p>
          <p className="font-mono text-sm">{timestamp.toLocaleString()}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-(--muted-foreground)">Request Body Size</p>
          <p className="font-mono text-sm">{formatBytes(decodeBody(request.requestBody).length)}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-(--muted-foreground)">Response Body Size</p>
          <p className="font-mono text-sm">
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
      <h3 className="mb-2 text-xs font-medium tracking-wider text-(--muted-foreground) uppercase">
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
    <div className="overflow-hidden rounded-md border border-(--border)">
      <table className="w-full font-mono text-xs">
        <tbody>
          {entries.map(([key, value], i) => (
            <tr key={`${key}-${String(i)}`} className={i % 2 === 0 ? 'bg-(--muted)/30' : ''}>
              <td className="w-48 px-3 py-1.5 align-top font-medium whitespace-nowrap text-(--foreground)">
                {key}
              </td>
              <td className="px-3 py-1.5 break-all text-(--muted-foreground)">{value}</td>
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
      <pre className="overflow-x-auto rounded-md border border-(--border) bg-(--muted)/50 p-3 font-mono text-xs whitespace-pre">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    );
  }

  return (
    <pre className="overflow-x-auto rounded-md border border-(--border) bg-(--muted)/50 p-3 font-mono text-xs whitespace-pre">
      {content}
    </pre>
  );
}
