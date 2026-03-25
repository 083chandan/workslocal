import Image from 'next/image';

export const metadata = {
  title: 'Web Inspector | WorksLocal Docs',
  description: 'Use the Web Inspector to visualize and debug your local traffic.',
};

const code = 'font-mono text-sm bg-surface-container px-1.5 py-0.5 text-primary';

export default function WebInspectorPage() {
  return (
    <article className="w-full px-4 py-6 md:px-8 md:py-8">
      <h1 className="font-headline text-3xl font-black text-on-surface">Web Inspector</h1>
      <p className="mt-4 font-mono text-sm tracking-wide text-muted">
        A built-in request/response inspector served at <code className={code}>localhost:4040</code>
        . View every HTTP request flowing through your tunnel in real time — headers, body, query
        params, timing, and status codes.
      </p>

      <div className="mt-8 overflow-hidden border border-outline">
        <Image
          src="/inspector.png"
          alt="WorksLocal Web Inspector showing request list and detail panes"
          width={2400}
          height={1350}
          className="w-full"
          quality={100}
          unoptimized
          priority
        />
      </div>

      <hr className="my-8 border-outline" />

      {/* ── Opening the inspector ────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Opening the inspector</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The inspector starts automatically when you run a tunnel:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {'workslocal http 3000\n'}
        <span className="text-muted"># → Web inspector at http://localhost:4040</span>
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Open <code className={code}>http://localhost:4040</code> in your browser. It works in both{' '}
        <code className={code}>http</code> and <code className={code}>catch</code> mode.
      </p>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        If port 4040 is already in use, the inspector silently skips — your tunnel still works. The
        CLI logs a warning:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        <span className="text-warning">⚠ Inspector port 4040 in use, inspector disabled</span>
      </pre>

      <hr className="my-8 border-outline" />

      {/* ── What you see ─────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">What you see</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The inspector is a dark-themed React SPA with a split-pane layout:
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Left pane — Request list
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        A chronological list of every request that passed through the tunnel, newest first. Each
        entry shows:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          <strong className="text-on-surface">Status badge</strong> — colored by status code (green
          for 2xx, red for 5xx, yellow for 4xx)
        </li>
        <li>
          <strong className="text-on-surface">Method + path</strong> — e.g.,{' '}
          <code className={code}>POST /webhooks/stripe</code>
        </li>
        <li>
          <strong className="text-on-surface">Timestamp</strong> — when the request arrived
        </li>
        <li>
          <strong className="text-on-surface">Latency</strong> — round-trip time including your
          local server&apos;s processing time
        </li>
      </ul>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Click any request to see its details in the right pane.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Right pane — Request detail
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Three tabs for the selected request:
      </p>

      <h4 className="mt-6 font-headline text-base font-bold text-on-surface">Headers tab</h4>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>Request headers (Host, User-Agent, Content-Type, Authorization, custom headers)</li>
        <li>Response headers</li>
      </ul>

      <h4 className="mt-6 font-headline text-base font-bold text-on-surface">Payload tab</h4>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>Request body with automatic JSON formatting and syntax highlighting</li>
        <li>Raw body view for non-JSON payloads</li>
        <li>Query parameters parsed into key-value pairs</li>
      </ul>

      <h4 className="mt-6 font-headline text-base font-bold text-on-surface">Response tab</h4>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          Status code with description (e.g., <code className={code}>200 OK</code>,{' '}
          <code className={code}>404 Not Found</code>)
        </li>
        <li>Response body with JSON formatting</li>
        <li>Response time in milliseconds</li>
      </ul>

      <hr className="my-8 border-outline" />

      {/* ── Features ─────────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Features</h2>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Live updates via SSE</h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The inspector uses Server-Sent Events (SSE) to receive new requests in real time. When a
        request flows through the tunnel, it appears in the inspector immediately — no polling, no
        refresh.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Copy as cURL</h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        One-click copy of any request as a cURL command. Useful for:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>Replaying a webhook in your terminal</li>
        <li>Sharing a request with a teammate</li>
        <li>Debugging outside the inspector</li>
      </ul>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Clear requests</h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Delete all captured requests from memory. Useful when you want a clean slate for testing.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Catch mode indicator</h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        When running in catch mode (<code className={code}>workslocal catch</code>), the inspector
        shows a &ldquo;CATCH&rdquo; badge and the response includes an{' '}
        <code className={code}>x-workslocal-mode: catch</code> header. This makes it clear that
        requests are being captured, not forwarded.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── How it works internally ──────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">How it works internally</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The inspector is a lightweight HTTP server running inside the CLI process. It serves two
        things:
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-on-surface-variant">
        <li>
          <strong className="text-on-surface">Static files</strong> — the pre-built React SPA (from{' '}
          <code className={code}>@workslocal/inspector</code> package)
        </li>
        <li>
          <strong className="text-on-surface">API endpoints</strong> — REST + SSE for the SPA to
          fetch and stream data
        </li>
      </ol>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Architecture</h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        <span className="text-primary">{'Browser (localhost:4040)\n'}</span>
        {'  ↕ HTTP (fetch + SSE)\n'}
        <span className="text-primary">{'Inspector Server (Node.js http.createServer)\n'}</span>
        {'  ↕ reads from\n'}
        <span className="text-primary">{'RequestStore (in-memory ring buffer)\n'}</span>
        {'  ↕ written by\n'}
        <span className="text-primary">{'TunnelClient (on every request:complete event)'}</span>
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        When a request flows through the tunnel:
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-on-surface-variant">
        <li>
          <code className={code}>TunnelClient</code> receives{' '}
          <code className={code}>http_request</code> from the relay via WebSocket
        </li>
        <li>
          <code className={code}>LocalProxy</code> (or <code className={code}>CatchProxy</code>)
          processes it and produces a response
        </li>
        <li>
          The request + response pair is saved as a <code className={code}>CapturedRequest</code> in
          the <code className={code}>RequestStore</code>
        </li>
        <li>
          The <code className={code}>InspectorServer</code> pushes the captured request to all
          connected SSE clients
        </li>
        <li>The browser SPA receives the SSE event and adds the request to the list</li>
      </ol>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">RequestStore</h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The <code className={code}>RequestStore</code> is an in-memory ring buffer. Key properties:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          <strong className="text-on-surface">Max size:</strong> 1,000 entries per tunnel
          (configurable via <code className={code}>MAX_REQUESTS_PER_TUNNEL</code> in{' '}
          <code className={code}>@workslocal/shared</code>)
        </li>
        <li>
          <strong className="text-on-surface">Eviction:</strong> when full, the oldest entry is
          removed (FIFO)
        </li>
        <li>
          <strong className="text-on-surface">Filtering:</strong> supports filtering by tunnel ID,
          HTTP method, and status code range
        </li>
        <li>
          <strong className="text-on-surface">Ordering:</strong> returns newest first by default
        </li>
      </ul>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">What gets captured</h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Every <code className={code}>CapturedRequest</code> contains:
      </p>
      <div className="mt-4 overflow-x-auto border border-outline">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-outline bg-surface text-left">
              <th className="px-4 py-2 font-medium text-on-surface">Field</th>
              <th className="px-4 py-2 font-medium text-on-surface">Type</th>
              <th className="px-4 py-2 font-medium text-on-surface">Description</th>
            </tr>
          </thead>
          <tbody className="text-on-surface-variant">
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">requestId</td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2">Unique ID assigned by the relay</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">tunnelId</td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2">Which tunnel received this request</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">method</td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2">HTTP method (GET, POST, PUT, etc.)</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">path</td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2">Request path (e.g., /api/users)</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">query</td>
              <td className="px-4 py-2">{'Record<string, string>'}</td>
              <td className="px-4 py-2">Parsed query parameters</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">requestHeaders</td>
              <td className="px-4 py-2">{'Record<string, string>'}</td>
              <td className="px-4 py-2">All request headers</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">requestBody</td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2">Base64-encoded request body</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">responseStatusCode</td>
              <td className="px-4 py-2">number</td>
              <td className="px-4 py-2">HTTP status code from your server</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">responseHeaders</td>
              <td className="px-4 py-2">{'Record<string, string>'}</td>
              <td className="px-4 py-2">All response headers</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">responseBody</td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2">Base64-encoded response body</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">responseTimeMs</td>
              <td className="px-4 py-2">number</td>
              <td className="px-4 py-2">Round-trip time in milliseconds</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-primary">timestamp</td>
              <td className="px-4 py-2">Date</td>
              <td className="px-4 py-2">When the request was received</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-outline" />

      {/* ── Inspector API endpoints ──────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Inspector API endpoints</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The inspector server exposes these endpoints at <code className={code}>localhost:4040</code>
        . You can use these from scripts, other tools, or AI agents.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        <code className={code}>GET /api/requests</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Returns all captured requests, newest first.
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        curl http://localhost:4040/api/requests
      </pre>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {`[\n`}
        {`  {\n`}
        {`    "requestId": "req_abc123",\n`}
        {`    "method": "POST",\n`}
        {`    "path": "/webhooks/stripe",\n`}
        {`    "responseStatusCode": 200,\n`}
        {`    "responseTimeMs": 12,\n`}
        {`    "timestamp": "2026-03-25T10:30:00.000Z",\n`}
        {`    ...\n`}
        {`  }\n`}
        {`]`}
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">Supports filtering (planned):</p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          <code className={code}>?method=POST</code> — filter by HTTP method
        </li>
        <li>
          <code className={code}>?minStatus=400&maxStatus=599</code> — filter by status code range
        </li>
      </ul>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        <code className={code}>DELETE /api/requests</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">Clear all captured requests.</p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        curl -X DELETE http://localhost:4040/api/requests
      </pre>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {`{ "ok": true }`}
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        <code className={code}>GET /api/tunnel</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Returns metadata about the current tunnel.
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        curl http://localhost:4040/api/tunnel
      </pre>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {`{\n`}
        {`  "mode": "http",\n`}
        {`  "publicUrl": "https://myapp.workslocal.exposed",\n`}
        {`  "subdomain": "myapp",\n`}
        {`  "domain": "workslocal.exposed",\n`}
        {`  "localPort": 3000,\n`}
        {`  "isPersistent": false,\n`}
        {`  "email": null\n`}
        {`}`}
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        <code className={code}>GET /api/events</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Server-Sent Events stream. Pushes new requests in real time.
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        curl http://localhost:4040/api/events
      </pre>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        <span className="text-muted">{'data: '}</span>
        {'{"type":"connected"}\n\n'}
        <span className="text-muted">{'data: '}</span>
        {
          '{"requestId":"req_abc","method":"POST","path":"/webhooks/stripe","responseStatusCode":200,...}\n\n'
        }
        <span className="text-muted">{'data: '}</span>
        {'{"requestId":"req_def","method":"GET","path":"/api/users","responseStatusCode":200,...}'}
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Each <code className={code}>data:</code> line is a full{' '}
        <code className={code}>CapturedRequest</code> JSON object. The initial{' '}
        <code className={code}>{`{"type":"connected"}`}</code> message confirms the SSE connection
        is open.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">CORS</h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        All API endpoints include <code className={code}>Access-Control-Allow-Origin: *</code>{' '}
        headers. This means you can fetch from the inspector API from any origin — useful during
        development when the inspector SPA runs on a different port (e.g., Vite dev server on{' '}
        <code className={code}>localhost:5173</code>).
      </p>

      <hr className="my-8 border-outline" />

      {/* ── Limitations ──────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Limitations</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          <strong className="text-on-surface">In-memory only</strong> — all captured requests are
          lost when the CLI exits. No persistence to disk. SQLite-backed persistence is planned.
        </li>
        <li>
          <strong className="text-on-surface">1,000 request buffer</strong> — the ring buffer holds
          the last 1,000 requests. Older requests are evicted when the buffer is full.
        </li>
        <li>
          <strong className="text-on-surface">No request editing/replay</strong> — you can view
          requests but cannot modify and re-send them yet. Request replay is planned.
        </li>
        <li>
          <strong className="text-on-surface">No HAR export</strong> — exporting the request history
          as a HAR 1.2 file is planned.
        </li>
        <li>
          <strong className="text-on-surface">No WebSocket inspection</strong> — WebSocket frames
          are passed through but not captured in the inspector. Only HTTP request/response pairs are
          shown.
        </li>
        <li>
          <strong className="text-on-surface">Fixed port 4040</strong> — the inspector always tries
          port 4040. If it&apos;s in use, the inspector is silently disabled. Configurable port via{' '}
          <code className={code}>--inspect-port</code> is planned.
        </li>
        <li>
          <strong className="text-on-surface">No filters in UI</strong> — method toggles, status
          range filters, and path search are planned but not yet in the current inspector build.
        </li>
        <li>
          <strong className="text-on-surface">Base64 bodies</strong> — request and response bodies
          are stored as base64. Large binary bodies (images, files) consume proportionally more
          memory.
        </li>
        <li>
          <strong className="text-on-surface">Single browser tab</strong> — opening multiple
          inspector tabs works (each gets its own SSE connection) but all show the same data.
        </li>
      </ul>

      <hr className="my-8 border-outline" />

      {/* ── Tips ─────────────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Tips</h2>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Use with catch mode</h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The inspector is most powerful when combined with catch mode. You can see exactly what a
        webhook provider sends without writing any handler code:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        {'workslocal catch --name stripe\n'}
        <span className="text-muted"># Open localhost:4040</span>
        {'\n'}
        <span className="text-muted"># Trigger a test event in Stripe dashboard</span>
        {'\n'}
        <span className="text-muted"># See the full payload in the inspector</span>
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Use the API for scripting
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The inspector API at <code className={code}>localhost:4040/api/requests</code> is a JSON
        endpoint. You can pipe it into <code className={code}>jq</code> for quick analysis:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        <span className="text-muted"># Get the last request body decoded from base64</span>
        {
          "\ncurl -s http://localhost:4040/api/requests | jq '.[0].requestBody' -r | base64 -d | jq .\n\n"
        }
        <span className="text-muted"># Count requests by status code</span>
        {
          "\ncurl -s http://localhost:4040/api/requests | jq 'group_by(.responseStatusCode) | map({status: .[0].responseStatusCode, count: length})'"
        }
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Combine with --json</h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        When running the tunnel with <code className={code}>--json</code>, the CLI outputs
        machine-readable JSON while the inspector provides the visual UI. Both work simultaneously.
      </p>
    </article>
  );
}
