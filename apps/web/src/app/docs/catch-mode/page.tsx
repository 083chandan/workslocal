import Image from 'next/image';

export const metadata = {
  title: 'Catch Mode | WorksLocal Docs',
  description: 'Learn how to use Catch Mode to intercept and inspect traffic.',
};

const code = 'font-mono text-sm bg-surface-container px-1.5 py-0.5 text-primary';

export default function CatchModePage() {
  return (
    <article className="w-full px-8 py-8">
      <h1 className="font-headline text-3xl font-black text-on-surface">Catch Mode</h1>
      <p className="mt-4 font-mono text-sm tracking-wide text-muted">
        Capture incoming HTTP requests without running a local server. Like webhook.site built into
        your tunnel tool. No competitor offers this.
      </p>

      <div className="mt-8 overflow-hidden border border-outline">
        <Image
          src="/inspector_catch.png"
          alt="WorksLocal catch mode inspector showing captured webhook requests"
          width={2400}
          height={1350}
          className="w-full"
          quality={100}
          unoptimized
          priority
        />
      </div>

      <hr className="my-8 border-outline" />

      {/* ── The problem ──────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">The problem</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        You&apos;re integrating a new webhook provider — Stripe, GitHub, Twilio, Shopify. You need
        to see what they send. But you haven&apos;t written a handler yet. So you either:
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-on-surface-variant">
        <li>
          Use webhook.site (separate tool, separate browser tab, copy-paste the URL, switch back)
        </li>
        <li>
          Write a throwaway Express handler with <code className={code}>console.log(req.body)</code>
          , run it, point the webhook at your tunnel, then delete the code
        </li>
      </ol>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Both waste time. Catch mode eliminates the middleman.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── How it works ─────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">How it works</h2>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal catch --name stripe
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        This creates a public HTTPS URL (
        <code className={code}>https://stripe.workslocal.exposed</code>) that:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          Accepts <strong className="text-on-surface">any</strong> HTTP request (GET, POST, PUT,
          PATCH, DELETE, OPTIONS)
        </li>
        <li>
          Returns a <strong className="text-on-surface">static response</strong> (default:{' '}
          <code className={code}>200 OK</code> with <code className={code}>{`{"ok":true}`}</code>)
        </li>
        <li>
          <strong className="text-on-surface">Captures</strong> the full request — method, path,
          headers, body, query params
        </li>
        <li>
          Displays it in the <strong className="text-on-surface">terminal</strong> and the{' '}
          <strong className="text-on-surface">web inspector</strong> at{' '}
          <code className={code}>localhost:4040</code>
        </li>
        <li>
          Does <strong className="text-on-surface">NOT</strong> forward to localhost — no local
          server needed
        </li>
      </ul>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The caller (Stripe, GitHub, your test script) gets a valid HTTP response, so it thinks the
        webhook was delivered successfully. Meanwhile, you&apos;re inspecting the payload at your
        leisure.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">What the caller sees</h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        <span className="text-muted">$ </span>
        {'curl https://stripe-payments.workslocal.exposed\n'}
        <span className="text-secondary">{`{"ok":true}`}</span>
      </pre>

      <hr className="my-8 border-outline" />

      {/* ── Step-by-step workflow ─────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Step-by-step workflow</h2>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">1. Start catching</h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal catch --name stripe-payments
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">Output:</p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        <span className="text-muted">
          {'────────────────────────────────────────────────────────────\n\n'}
        </span>
        <span className="text-secondary">{'✔ Catch mode active!\n\n'}</span>
        {'Public URL:   '}
        <span className="text-primary">{'https://stripe-payments.workslocal.exposed\n'}</span>
        {'Inspector:    http://localhost:4040\n'}
        {'Returning:    200 {"ok":true}\n'}
        {'Subdomain:    stripe-payments\n\n'}
        {'Paste the URL in your webhook dashboard.\n'}
        {'All requests appear below and at http://localhost:4040\n\n'}
        <span className="text-muted">{'Press Ctrl+C to stop.\n\n'}</span>
        <span className="text-muted">
          {'────────────────────────────────────────────────────────────\n\n'}
        </span>
        {'GET     / '}
        <span className="text-secondary">{'200'}</span>
        {' 1ms\n'}
        {'GET     /favicon.ico '}
        <span className="text-secondary">{'200'}</span>
        {' 0ms'}
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        2. Configure the webhook provider
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Go to your webhook provider&apos;s dashboard and paste the tunnel URL:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          <strong className="text-on-surface">Stripe:</strong> Dashboard → Developers → Webhooks →
          Add endpoint →{' '}
          <code className={code}>https://stripe-payments.workslocal.exposed/webhooks/stripe</code>
        </li>
        <li>
          <strong className="text-on-surface">GitHub:</strong> Repo → Settings → Webhooks → Add
          webhook → <code className={code}>https://stripe-payments.workslocal.exposed/github</code>
        </li>
        <li>
          <strong className="text-on-surface">Twilio:</strong> Console → Phone Numbers → Configure →
          Webhook URL → <code className={code}>https://stripe-payments.workslocal.exposed/sms</code>
        </li>
      </ul>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        3. Trigger a test event
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Most providers have a &ldquo;Send test event&rdquo; button. Click it.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        4. Inspect the payload
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The request appears in your terminal:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {'POST /webhooks/stripe '}
        <span className="text-secondary">{'200'}</span>
        {' 2ms'}
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        And in the web inspector at <code className={code}>localhost:4040</code>:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          Full request headers (including <code className={code}>Stripe-Signature</code>,{' '}
          <code className={code}>Content-Type</code>, <code className={code}>User-Agent</code>)
        </li>
        <li>Complete JSON body with syntax highlighting</li>
        <li>Query parameters (if any)</li>
        <li>
          The <code className={code}>x-workslocal-mode: catch</code> response header
        </li>
      </ul>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        5. Switch to tunnel mode
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Once you&apos;ve seen the payload and written your handler:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        <span className="text-muted"># Stop catch mode (Ctrl+C)</span>
        {'\n'}
        <span className="text-muted"># Start tunnel mode with the same subdomain</span>
        {'\nworkslocal http 3000 --name stripe-payments'}
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The URL stays the same —{' '}
        <code className={code}>https://stripe-payments.workslocal.exposed</code>. No need to update
        the webhook dashboard. Your handler now receives real webhook data through the exact same
        URL.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── Customizing the response ─────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Customizing the response</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        By default, catch mode returns <code className={code}>200 OK</code> with{' '}
        <code className={code}>{`{"ok":true}`}</code>. You can customize this:
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Custom status code</h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal catch --name test --status 202
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Returns <code className={code}>202 Accepted</code> to every request. Useful when a provider
        expects a specific status code.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Custom response body</h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {'workslocal catch --name test --body \'{"received": true}\''}
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Returns the specified body. The <code className={code}>Content-Type</code> header defaults
        to <code className={code}>application/json</code>.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── How it works internally ──────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">How it works internally</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Catch mode uses the same <code className={code}>TunnelClient</code> as{' '}
        <code className={code}>workslocal http</code>, but with a{' '}
        <code className={code}>proxyOverride</code> instead of the{' '}
        <code className={code}>LocalProxy</code>.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Normal mode flow</h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        <span className="text-primary">{'http_request (from relay)\n'}</span>
        {'  → LocalProxy.forward(msg, localPort)\n'}
        {'    → http.request to localhost:3000\n'}
        {'    → wait for response\n'}
        <span className="text-primary">{'  → http_response (back to relay)'}</span>
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Catch mode flow</h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        <span className="text-primary">{'http_request (from relay)\n'}</span>
        {'  → CatchProxy.respond(msg)\n'}
        {'    → return { statusCode: 200, headers: {...}, body: "" }\n'}
        <span className="text-secondary">{'    → NO network call to localhost\n'}</span>
        <span className="text-primary">{'  → http_response (back to relay)'}</span>
      </pre>

      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The <code className={code}>CatchProxy</code> is a simple function that returns a static
        response object. It&apos;s created in <code className={code}>catch-proxy.ts</code>:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        <span className="text-primary">{'export function '}</span>
        {'createCatchProxy(options: CatchProxyOptions): CatchProxy {\n'}
        {'  return {\n'}
        {'    respond(msg: HttpRequestMessage): LocalProxyResponse {\n'}
        {'      return {\n'}
        {'        statusCode: options.statusCode,\n'}
        {'        headers: {\n'}
        {"          'content-type': 'application/json',\n"}
        {"          'x-workslocal-mode': 'catch',\n"}
        {'          ...options.responseHeaders,\n'}
        {'        },\n'}
        {"        body: Buffer.from(options.responseBody || '').toString('base64'),\n"}
        {'      };\n'}
        {'    },\n'}
        {'  };\n'}
        {'}'}
      </pre>

      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The request is still captured by the <code className={code}>RequestStore</code> and pushed
        to the inspector via SSE — exactly like normal mode. The only difference is where the
        response comes from.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Response header</h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Every catch mode response includes:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        x-workslocal-mode: catch
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        This lets you (or the caller) distinguish catch mode responses from real server responses.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── Use cases ────────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Use cases</h2>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Webhook development</h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The primary use case. See what Stripe, GitHub, Twilio, Shopify, Clerk, or any other service
        sends before writing handler code.
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        {'workslocal catch --name stripe\n'}
        <span className="text-muted"># Paste URL in Stripe dashboard</span>
        {'\n'}
        <span className="text-muted"># Trigger test event</span>
        {'\n'}
        <span className="text-muted"># See payload in inspector</span>
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        API contract discovery
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Working with a poorly documented API that calls your endpoint? Use catch mode to see exactly
        what they send — method, headers, body structure, authentication headers.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Load testing inspection
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Point a load testing tool (k6, Artillery, wrk) at your catch URL and inspect the request
        patterns without running a server.
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        {'workslocal catch --name load-test\n'}
        <span className="text-muted"># In another terminal:</span>
        {'\nk6 run --vus 10 --duration 30s -e URL=https://load-test.workslocal.exposed script.js\n'}
        <span className="text-muted"># View all requests in inspector</span>
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        CI/CD webhook debugging
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Configure your CI provider (GitHub Actions, GitLab CI, CircleCI) to send webhook events to a
        catch URL. Inspect the payload structure without deploying a handler.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Quick mock endpoint</h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Need a quick endpoint that returns a specific response for integration testing?
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {
          'workslocal catch --name mock-api --status 201 --body \'{"id": "usr_123", "name": "Test User"}\''
        }
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Any request to <code className={code}>https://mock-api.workslocal.exposed/*</code> returns
        the specified response.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── Catch mode vs webhook.site ────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">
        Catch mode vs webhook.site
      </h2>
      <div className="mt-4 overflow-x-auto border border-outline">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-outline bg-surface text-left">
              <th className="px-4 py-2 font-medium text-on-surface">Feature</th>
              <th className="px-4 py-2 font-medium text-on-surface">WorksLocal catch mode</th>
              <th className="px-4 py-2 font-medium text-on-surface">webhook.site</th>
            </tr>
          </thead>
          <tbody className="text-on-surface-variant">
            <tr className="border-b border-outline">
              <td className="px-4 py-2">Setup</td>
              <td className="px-4 py-2 text-secondary">One terminal command</td>
              <td className="px-4 py-2">Open browser, copy URL</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2">Same tool as tunnel</td>
              <td className="px-4 py-2 text-secondary">Yes — switch to http mode with same URL</td>
              <td className="px-4 py-2">No — separate tool entirely</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2">Inspector</td>
              <td className="px-4 py-2 text-secondary">Built-in at localhost:4040</td>
              <td className="px-4 py-2">Web-based</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2">Custom subdomain</td>
              <td className="px-4 py-2 text-secondary">Yes (--name)</td>
              <td className="px-4 py-2">No (random only)</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2">Custom response</td>
              <td className="px-4 py-2 text-secondary">Yes (--status, --body)</td>
              <td className="px-4 py-2">Limited (paid)</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2">Self-hostable</td>
              <td className="px-4 py-2 text-secondary">Yes (MIT license)</td>
              <td className="px-4 py-2">No</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2">Data privacy</td>
              <td className="px-4 py-2 text-secondary">Local only — nothing stored on server</td>
              <td className="px-4 py-2">Stored on their servers</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2">Persistent URL</td>
              <td className="px-4 py-2 text-secondary">Yes (with account)</td>
              <td className="px-4 py-2">Expires</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2">Offline viewing</td>
              <td className="px-4 py-2 text-secondary">Yes (inspector runs locally)</td>
              <td className="px-4 py-2">Requires internet</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2">Copy as cURL</td>
              <td className="px-4 py-2 text-secondary">Yes</td>
              <td className="px-4 py-2">Limited</td>
            </tr>
            <tr>
              <td className="px-4 py-2">Cost</td>
              <td className="px-4 py-2 text-secondary">Free forever</td>
              <td className="px-4 py-2">Free tier + paid</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-outline" />

      {/* ── Limitations ──────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Limitations</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          <strong className="text-on-surface">No request queuing for later replay</strong> — catch
          mode captures requests but cannot &ldquo;hold&rdquo; them and replay them to your local
          server when it comes online. This is a planned feature. Currently, switching from catch to
          tunnel mode means the webhook provider needs to re-send events.
        </li>
        <li>
          <strong className="text-on-surface">Static response only</strong> — every request gets the
          same response. You cannot return different responses based on the request path, method, or
          body. For dynamic mock responses, use tunnel mode with a simple local server.
        </li>
        <li>
          <strong className="text-on-surface">No webhook signature verification</strong> — catch
          mode does not verify Stripe signatures, GitHub HMAC, or other webhook authentications.
          Signature verification display in the inspector is planned.
        </li>
        <li>
          <strong className="text-on-surface">In-memory only</strong> — captured requests are lost
          when the CLI exits. The 1,000 request ring buffer limit applies.
        </li>
        <li>
          <strong className="text-on-surface">No response delay</strong> — the response is instant.
          You cannot simulate slow endpoints. Configurable response delay is planned.
        </li>
        <li>
          <strong className="text-on-surface">HTTP only</strong> — catch mode does not capture
          WebSocket connections. WebSocket frames pass through the tunnel but are not stored in the
          RequestStore.
        </li>
      </ul>

      <hr className="my-8 border-outline" />

      {/* ── Tips ─────────────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Tips</h2>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Name your catch URLs meaningfully
      </h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        {
          'workslocal catch --name stripe-payments\nworkslocal catch --name github-pushes\nworkslocal catch --name twilio-sms'
        }
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Descriptive names make it easy to keep webhook URLs organized across projects.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Use the inspector API for automation
      </h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        <span className="text-muted"># Wait for a request to arrive, then extract the body</span>
        {'\nwhile true; do\n'}
        {"  BODY=$(curl -s http://localhost:4040/api/requests | jq '.[0].requestBody' -r)\n"}
        {'  if [ "$BODY" != "null" ]; then\n'}
        {'    echo "$BODY" | base64 -d | jq .\n'}
        {'    break\n'}
        {'  fi\n'}
        {'  sleep 1\n'}
        {'done'}
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Combine with --json for scripts
      </h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        {'workslocal catch --name test --json 2>/dev/null &\n'}
        {'PID=$!\n'}
        <span className="text-muted"># ... trigger webhook ...</span>
        {"\ncurl -s http://localhost:4040/api/requests | jq '.[0]'\n"}
        {'kill $PID'}
      </pre>
    </article>
  );
}
