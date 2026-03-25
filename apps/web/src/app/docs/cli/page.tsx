export const metadata = {
  title: 'CLI Reference | WorksLocal Docs',
  description: 'WorksLocal CLI commands, flags, and configuration options.',
};

const code = 'font-mono text-sm bg-surface-container px-1.5 py-0.5 text-primary';

export default function CLIPage() {
  return (
    <article className="w-full px-4 py-6 md:px-8 md:py-8">
      <h1 className="font-headline text-3xl font-black text-on-surface">CLI Reference</h1>
      <p className="mt-4 font-mono text-sm tracking-wide text-muted">
        Complete reference for the <code className={code}>workslocal</code> command-line tool.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── Installation ─────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Installation</h2>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        npm install -g workslocal
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">Verify:</p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal --version
      </pre>

      <hr className="my-8 border-outline" />

      {/* ── Commands ─────────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Commands</h2>

      {/* ── workslocal http ──────────────────────────────── */}
      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        <code className={code}>workslocal http &lt;port&gt;</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Start an HTTP tunnel forwarding to your local server.
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {
          'workslocal http 3000\nworkslocal http 3000 --name myapp\nworkslocal http 8080 --name api --json'
        }
      </pre>

      <h4 className="mt-6 font-headline text-base font-bold text-on-surface">Arguments</h4>
      <div className="mt-4 overflow-x-auto border border-outline">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-outline bg-surface text-left">
              <th className="px-4 py-2 font-medium text-on-surface">Argument</th>
              <th className="px-4 py-2 font-medium text-on-surface">Required</th>
              <th className="px-4 py-2 font-medium text-on-surface">Description</th>
            </tr>
          </thead>
          <tbody className="text-on-surface-variant">
            <tr>
              <td className="px-4 py-2 text-primary">port</td>
              <td className="px-4 py-2">Yes</td>
              <td className="px-4 py-2">
                Local port to forward to (e.g., <code className={code}>3000</code>,{' '}
                <code className={code}>8080</code>)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="mt-6 font-headline text-base font-bold text-on-surface">Flags</h4>
      <div className="mt-4 overflow-x-auto border border-outline">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-outline bg-surface text-left">
              <th className="px-4 py-2 font-medium text-on-surface">Flag</th>
              <th className="px-4 py-2 font-medium text-on-surface">Type</th>
              <th className="px-4 py-2 font-medium text-on-surface">Default</th>
              <th className="px-4 py-2 font-medium text-on-surface">Description</th>
            </tr>
          </thead>
          <tbody className="text-on-surface-variant">
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">--name</td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2 text-muted">Random</td>
              <td className="px-4 py-2">
                Custom subdomain. Lowercase, 3–50 chars, no leading/trailing hyphens
              </td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">--domain</td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2 text-muted">workslocal.exposed</td>
              <td className="px-4 py-2">Tunnel domain (currently only workslocal.exposed)</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">--json</td>
              <td className="px-4 py-2">boolean</td>
              <td className="px-4 py-2 text-muted">false</td>
              <td className="px-4 py-2">Output tunnel info as JSON, suppress colored logs</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-primary">--inspect</td>
              <td className="px-4 py-2">boolean</td>
              <td className="px-4 py-2 text-muted">true</td>
              <td className="px-4 py-2">Start web inspector at localhost:4040</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="mt-6 font-headline text-base font-bold text-on-surface">Behavior</h4>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>Creates a WebSocket connection to the relay server</li>
        <li>Registers a subdomain (random or custom)</li>
        <li>
          Forwards incoming HTTP requests to <code className={code}>localhost:&lt;port&gt;</code>
        </li>
        <li>Prints live request log with method, path, status, and latency</li>
        <li>
          Opens web inspector at <code className={code}>http://localhost:4040</code>
        </li>
        <li>Auto-reconnects on disconnect (up to 10 attempts with exponential backoff)</li>
        <li>Re-creates tunnels with the same subdomain after reconnect</li>
      </ul>

      <h4 className="mt-6 font-headline text-base font-bold text-on-surface">Exit codes</h4>
      <div className="mt-4 overflow-x-auto border border-outline">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-outline bg-surface text-left">
              <th className="px-4 py-2 font-medium text-on-surface">Code</th>
              <th className="px-4 py-2 font-medium text-on-surface">Meaning</th>
            </tr>
          </thead>
          <tbody className="text-on-surface-variant">
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">0</td>
              <td className="px-4 py-2">Clean shutdown (Ctrl+C or workslocal stop)</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">1</td>
              <td className="px-4 py-2">Connection error (relay server unreachable)</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-primary">2</td>
              <td className="px-4 py-2">Subdomain error (taken, invalid, or reserved)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="mt-6 font-headline text-base font-bold text-on-surface">
        What happens on Ctrl+C
      </h4>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-on-surface-variant">
        <li>
          Sends <code className={code}>close_tunnel</code> to the relay for each active tunnel
        </li>
        <li>Closes the WebSocket connection cleanly (code 1000)</li>
        <li>Stops the web inspector server</li>
        <li>Exits with code 0</li>
      </ol>

      <hr className="my-8 border-outline" />

      {/* ── workslocal catch ─────────────────────────────── */}
      <h3 className="font-headline text-lg font-bold text-on-surface">
        <code className={code}>workslocal catch</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Start a tunnel in catch mode — captures incoming requests without forwarding to a local
        server. Like webhook.site in your terminal.
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {
          'workslocal catch\nworkslocal catch --name stripe\nworkslocal catch --port 8080 --name github'
        }
      </pre>

      <h4 className="mt-6 font-headline text-base font-bold text-on-surface">Flags</h4>
      <div className="mt-4 overflow-x-auto border border-outline">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-outline bg-surface text-left">
              <th className="px-4 py-2 font-medium text-on-surface">Flag</th>
              <th className="px-4 py-2 font-medium text-on-surface">Type</th>
              <th className="px-4 py-2 font-medium text-on-surface">Default</th>
              <th className="px-4 py-2 font-medium text-on-surface">Description</th>
            </tr>
          </thead>
          <tbody className="text-on-surface-variant">
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">--name</td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2 text-muted">Random</td>
              <td className="px-4 py-2">Custom subdomain</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">--port</td>
              <td className="px-4 py-2">number</td>
              <td className="px-4 py-2 text-muted">—</td>
              <td className="px-4 py-2">Port for the catch mode URL display (cosmetic)</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">--status</td>
              <td className="px-4 py-2">number</td>
              <td className="px-4 py-2 text-muted">200</td>
              <td className="px-4 py-2">HTTP status code to return to callers</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">--body</td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2 text-muted">
                {'"'}
                {'"'}
              </td>
              <td className="px-4 py-2">Response body to return to callers</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-primary">--json</td>
              <td className="px-4 py-2">boolean</td>
              <td className="px-4 py-2 text-muted">false</td>
              <td className="px-4 py-2">Output as JSON</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="mt-6 font-headline text-base font-bold text-on-surface">Behavior</h4>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          Creates a tunnel like <code className={code}>workslocal http</code> but does NOT forward
          to localhost
        </li>
        <li>
          Every incoming request gets a static response (default:{' '}
          <code className={code}>200 OK</code> with empty body)
        </li>
        <li>Requests are captured in the RequestStore and displayed in the terminal + inspector</li>
        <li>
          The response includes an <code className={code}>x-workslocal-mode: catch</code> header so
          callers know it&apos;s catch mode
        </li>
      </ul>

      <h4 className="mt-6 font-headline text-base font-bold text-on-surface">
        How it works internally
      </h4>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The CLI creates a <code className={code}>TunnelClient</code> with a{' '}
        <code className={code}>proxyOverride</code> function instead of the normal{' '}
        <code className={code}>LocalProxy</code>. When an <code className={code}>http_request</code>{' '}
        message arrives from the relay, the override returns the static response immediately. The
        request is still captured in the RequestStore and pushed to the inspector via SSE.
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        <span className="text-muted">
          {'Stripe → tunnel URL → Cloudflare → Durable Object → WebSocket → CLI\n'}
        </span>
        <span className="text-muted">
          {'                                                                  ↓\n'}
        </span>
        {'                                                          CatchProxy returns 200\n'}
        {'                                                          RequestStore captures it\n'}
        {'                                                          Inspector shows it via SSE\n'}
        <span className="text-muted">
          {'                                                                  ↓\n'}
        </span>
        <span className="text-secondary">
          {'                                                          200 OK → back to Stripe'}
        </span>
      </pre>

      <h4 className="mt-6 font-headline text-base font-bold text-on-surface">Typical workflow</h4>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        <span className="text-muted"># Step 1: Start catching</span>
        {'\nworkslocal catch --name stripe-test\n'}
        <span className="text-muted"># → https://stripe-test.workslocal.exposed (catching)</span>
        {'\n\n'}
        <span className="text-muted">
          # Step 2: Paste URL in Stripe webhook dashboard, trigger test event
        </span>
        {'\n\n'}
        <span className="text-muted">
          # Step 3: See the payload in terminal + localhost:4040 inspector
        </span>
        {'\n\n'}
        <span className="text-muted">
          # Step 4: When your handler is ready, switch to tunnel mode:
        </span>
        {'\nworkslocal http 3000 --name stripe-test\n'}
        <span className="text-muted"># → Same URL, now forwarding to localhost:3000</span>
      </pre>

      <hr className="my-8 border-outline" />

      {/* ── workslocal login ─────────────────────────────── */}
      <h3 className="font-headline text-lg font-bold text-on-surface">
        <code className={code}>workslocal login</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Authenticate with WorksLocal via browser-based OAuth (GitHub via Clerk).
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal login
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Opens your default browser to complete the login flow. On success, the session token is
        stored in <code className={code}>~/.workslocal/config.json</code>.
      </p>

      <h4 className="mt-6 font-headline text-base font-bold text-on-surface">Why authenticate</h4>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>Persistent subdomains that survive restarts permanently</li>
        <li>Up to 3 reserved subdomains (free tier)</li>
        <li>Required for future features: teams, custom domains, API keys</li>
      </ul>

      <hr className="my-8 border-outline" />

      {/* ── workslocal logout ────────────────────────────── */}
      <h3 className="font-headline text-lg font-bold text-on-surface">
        <code className={code}>workslocal logout</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">Clear stored credentials.</p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal logout
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Deletes <code className={code}>~/.workslocal/config.json</code>. After logout, you&apos;re
        back to anonymous mode with random subdomains.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── workslocal whoami ────────────────────────────── */}
      <h3 className="font-headline text-lg font-bold text-on-surface">
        <code className={code}>workslocal whoami</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Show current authentication status.
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal whoami
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        <strong className="text-on-surface">Authenticated:</strong>
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {'Logged in as chandan@example.com\nUser ID: user_abc123'}
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        <strong className="text-on-surface">Anonymous:</strong>
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {"Not logged in. Run 'workslocal login' to authenticate.\nAnonymous token: a1b2c3..."}
      </pre>

      <hr className="my-8 border-outline" />

      {/* ── workslocal status ────────────────────────────── */}
      <h3 className="font-headline text-lg font-bold text-on-surface">
        <code className={code}>workslocal status</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">List all active tunnels.</p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {'workslocal status\nworkslocal status --json'}
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        <strong className="text-on-surface">Output:</strong>
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        {'Active tunnels:\n\n'}
        {'  myapp    '}
        <span className="text-primary">{'https://myapp.workslocal.exposed'}</span>
        {'    → localhost:3000    42 requests\n'}
        {'  stripe   '}
        <span className="text-primary">{'https://stripe.workslocal.exposed'}</span>
        {'   → catch mode        7 requests'}
      </pre>

      <hr className="my-8 border-outline" />

      {/* ── workslocal stop ──────────────────────────────── */}
      <h3 className="font-headline text-lg font-bold text-on-surface">
        <code className={code}>workslocal stop &lt;name&gt;</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Stop a specific tunnel by subdomain name.
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal stop myapp
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        <code className={code}>workslocal stop --all</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">Stop all active tunnels.</p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal stop --all
      </pre>

      <hr className="my-8 border-outline" />

      {/* ── workslocal domains ───────────────────────────── */}
      <h3 className="font-headline text-lg font-bold text-on-surface">
        <code className={code}>workslocal domains</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">List available tunnel domains.</p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal domains
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        <strong className="text-on-surface">Output:</strong>
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {'Available domains:\n  workslocal.exposed (default)'}
      </pre>

      <hr className="my-8 border-outline" />

      {/* ── workslocal config ────────────────────────────── */}
      <h3 className="font-headline text-lg font-bold text-on-surface">
        <code className={code}>workslocal config</code>
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Get and set configuration values.
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {
          'workslocal config set default-domain workslocal.exposed\nworkslocal config get default-domain'
        }
      </pre>

      <hr className="my-8 border-outline" />

      {/* ── Global flags ─────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Global flags</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        These flags work with every command:
      </p>
      <div className="mt-4 overflow-x-auto border border-outline">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-outline bg-surface text-left">
              <th className="px-4 py-2 font-medium text-on-surface">Flag</th>
              <th className="px-4 py-2 font-medium text-on-surface">Description</th>
            </tr>
          </thead>
          <tbody className="text-on-surface-variant">
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">--version</td>
              <td className="px-4 py-2">Print version and exit</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">--help</td>
              <td className="px-4 py-2">Print help for the command</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-primary">--json</td>
              <td className="px-4 py-2">Machine-readable JSON output (no colors, no spinners)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-outline" />

      {/* ── Config file ──────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Config file</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Located at <code className={code}>~/.workslocal/config.json</code>:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {`{\n`}
        {`  "anonymousToken": "hex-string-64-chars",\n`}
        {`  "sessionToken": "eyJ...",\n`}
        {`  "userId": "user_xxx",\n`}
        {`  "serverUrl": "wss://api.workslocal.dev/ws"\n`}
        {`}`}
      </pre>
      <div className="mt-4 overflow-x-auto border border-outline">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-outline bg-surface text-left">
              <th className="px-4 py-2 font-medium text-on-surface">Field</th>
              <th className="px-4 py-2 font-medium text-on-surface">Description</th>
            </tr>
          </thead>
          <tbody className="text-on-surface-variant">
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">anonymousToken</td>
              <td className="px-4 py-2">
                Random 32-byte hex token, generated on first run. Gives anonymous users a consistent
                identity for subdomain reservation on reconnect
              </td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">sessionToken</td>
              <td className="px-4 py-2">
                Clerk JWT, set after <code className={code}>workslocal login</code>. Enables
                persistent subdomains
              </td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">userId</td>
              <td className="px-4 py-2">Clerk user ID</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-primary">serverUrl</td>
              <td className="px-4 py-2">
                Relay server URL. Override with <code className={code}>WORKSLOCAL_SERVER_URL</code>{' '}
                env var
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-outline" />

      {/* ── Environment variables ────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Environment variables</h2>
      <div className="mt-4 overflow-x-auto border border-outline">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-outline bg-surface text-left">
              <th className="px-4 py-2 font-medium text-on-surface">Variable</th>
              <th className="px-4 py-2 font-medium text-on-surface">Description</th>
              <th className="px-4 py-2 font-medium text-on-surface">Default</th>
            </tr>
          </thead>
          <tbody className="text-on-surface-variant">
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">WORKSLOCAL_SERVER_URL</td>
              <td className="px-4 py-2">WebSocket URL of the relay server</td>
              <td className="px-4 py-2 text-muted">wss://api.workslocal.dev/ws</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-primary">WORKSLOCAL_API_KEY</td>
              <td className="px-4 py-2">
                API key for authentication (alternative to{' '}
                <code className={code}>workslocal login</code>)
              </td>
              <td className="px-4 py-2 text-muted">—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-outline" />

      {/* ── Auto-reconnect ───────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Auto-reconnect</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        When the WebSocket connection drops (laptop sleep, network change, relay restart),
        WorksLocal automatically reconnects:
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-on-surface-variant">
        <li>
          Exponential backoff: <code className={code}>1s → 2s → 4s → 8s → 16s → 30s</code> (capped)
        </li>
        <li>Up to 10 attempts by default</li>
        <li>On successful reconnect, all tunnels are re-created with the same subdomains</li>
        <li>
          Subdomain reservation (5 minutes for anonymous, permanent for authenticated) prevents
          hijacking during reconnect
        </li>
      </ol>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        If all 10 attempts fail, the CLI exits with a <code className={code}>reconnect_failed</code>{' '}
        event.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── Rate limits ──────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Rate limits</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        The relay server enforces these limits:
      </p>
      <div className="mt-4 overflow-x-auto border border-outline">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-outline bg-surface text-left">
              <th className="px-4 py-2 font-medium text-on-surface">Scope</th>
              <th className="px-4 py-2 font-medium text-on-surface">Limit</th>
              <th className="px-4 py-2 font-medium text-on-surface">Window</th>
            </tr>
          </thead>
          <tbody className="text-on-surface-variant">
            <tr className="border-b border-outline">
              <td className="px-4 py-2">Per tunnel</td>
              <td className="px-4 py-2 text-primary">1,000 requests</td>
              <td className="px-4 py-2">1 hour</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2">Per IP (anonymous)</td>
              <td className="px-4 py-2 text-primary">200 requests</td>
              <td className="px-4 py-2">1 minute</td>
            </tr>
            <tr className="border-b border-outline">
              <td className="px-4 py-2">Per user (authenticated)</td>
              <td className="px-4 py-2 text-primary">5,000 requests</td>
              <td className="px-4 py-2">1 hour</td>
            </tr>
            <tr>
              <td className="px-4 py-2">Tunnel creation</td>
              <td className="px-4 py-2 text-primary">10 tunnels</td>
              <td className="px-4 py-2">1 hour</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        When rate limited, the relay returns <code className={code}>429 Too Many Requests</code>.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── Limitations ──────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Limitations</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          <strong className="text-on-surface">HTTP only</strong> — no TCP, UDP, or raw socket
          tunneling
        </li>
        <li>
          <strong className="text-on-surface">Single tunnel domain</strong> —{' '}
          <code className={code}>workslocal.exposed</code> only (<code className={code}>.io</code>,{' '}
          <code className={code}>.run</code> coming later)
        </li>
        <li>
          <strong className="text-on-surface">10 MB body limit</strong> — request bodies over 10 MB
          are rejected with 413
        </li>
        <li>
          <strong className="text-on-surface">30-second timeout</strong> — local server must respond
          within 30 seconds or 504 is returned
        </li>
        <li>
          <strong className="text-on-surface">No SSE/streaming</strong> — responses are fully
          buffered (streaming support coming next release)
        </li>
        <li>
          <strong className="text-on-surface">In-memory request store</strong> — captured requests
          lost on exit (1,000 max per tunnel, ring buffer)
        </li>
        <li>
          <strong className="text-on-surface">No password protection yet</strong> —{' '}
          <code className={code}>--password</code> and <code className={code}>--allow-ip</code>{' '}
          flags are planned
        </li>
        <li>
          <strong className="text-on-surface">macOS/Linux/Windows</strong> — requires Node.js 20+.
          Standalone binaries (Homebrew, winget) coming later
        </li>
      </ul>
    </article>
  );
}
