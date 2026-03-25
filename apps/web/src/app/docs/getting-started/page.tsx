import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Getting Started',
  description:
    'Install WorksLocal and expose your localhost to the internet in 30 seconds. Step-by-step setup guide — no account required.',
  alternates: { canonical: '/docs/getting-started' },
  openGraph: {
    title: 'Getting Started | WorksLocal',
    description: 'Install WorksLocal and expose your localhost to the internet in 30 seconds.',
    url: '/docs/getting-started',
  },
};

const code = 'font-mono text-sm bg-surface-container px-1.5 py-0.5 text-primary';

export default function GettingStartedPage() {
  return (
    <article className="w-full px-4 py-6 md:px-8 md:py-8">
      <h1 className="font-headline text-3xl font-black text-on-surface">Getting Started</h1>
      <p className="mt-4 font-mono text-sm tracking-wide text-muted">
        Expose your local development server to the internet in 30 seconds. No account required.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── Prerequisites ──────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Prerequisites</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          <strong className="text-on-surface">Node.js 20+</strong> — check with{' '}
          <code className={code}>node --version</code>
        </li>
        <li>
          A local server running on any port (e.g., <code className={code}>localhost:3000</code>)
        </li>
      </ul>

      <hr className="my-8 border-outline" />

      {/* ── Install ────────────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Install</h2>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Option A: Global install (recommended)
      </h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        npm install -g workslocal
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        This gives you the <code className={code}>workslocal</code> command globally. Verify with:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {`workslocal --version\n`}
        <span className="text-muted"># WorksLocal v0.1.1</span>
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Option B: Run without installing
      </h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        npx workslocal http 3000
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Uses <code className={code}>npx</code> to download and run WorksLocal in one step. Good for
        trying it out.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── Create your first tunnel ──────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Create your first tunnel</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Make sure your local server is running, then:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal http 3000
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Replace <code className={code}>3000</code> with whatever port your server is on. You&apos;ll
        see:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm leading-relaxed text-on-surface">
        <span className="text-muted">
          {'────────────────────────────────────────────────────────────\n\n'}
        </span>
        <span className="text-secondary">{'✔ Tunnel is live!\n\n'}</span>
        {'Public URL:   '}
        <span className="text-primary">{'https://a8f3k2.workslocal.exposed\n'}</span>
        {'Forwarding:   http://localhost:3000\n'}
        {'Inspector:    http://localhost:4040\n'}
        {'Subdomain:    a8f3k2\n'}
        {'Domain:       workslocal.exposed\n'}
        {'Type:         ephemeral\n\n'}
        <span className="text-muted">{'Press Ctrl+C to stop the tunnel\n\n'}</span>
        <span className="text-muted">
          {'────────────────────────────────────────────────────────────\n\n'}
        </span>
        {'GET     / '}
        <span className="text-secondary">{'200'}</span>
        {' 62ms'}
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        That <code className={code}>https://...workslocal.exposed</code> URL is publicly accessible
        from anywhere on the internet. Share it with a teammate, paste it in a webhook dashboard, or
        open it on your phone.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── Custom subdomain ──────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Custom subdomain</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        By default, WorksLocal assigns a random subdomain. To pick your own:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal http 3000 --name myapp
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        This gives you <code className={code}>https://myapp.workslocal.exposed</code> — the same URL
        every time you start the tunnel. Custom subdomains are persistent across restarts for
        authenticated users.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Subdomain rules</h3>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>Lowercase letters, numbers, and hyphens only</li>
        <li>3–50 characters</li>
        <li>Cannot start or end with a hyphen</li>
        <li>
          Reserved names (<code className={code}>www</code>, <code className={code}>api</code>,{' '}
          <code className={code}>admin</code>, <code className={code}>mail</code>, etc.) are blocked
        </li>
      </ul>

      <hr className="my-8 border-outline" />

      {/* ── Anonymous vs authenticated ────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">
        Anonymous vs authenticated
      </h2>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Anonymous (no account)
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">Works immediately. You get:</p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          Random subdomain (e.g., <code className={code}>a8f3k2.workslocal.exposed</code>)
        </li>
        <li>
          Custom subdomains with <code className={code}>--name</code> (reserved for 5 minutes after
          disconnect)
        </li>
        <li>
          Web inspector at <code className={code}>localhost:4040</code>
        </li>
        <li>Full HTTP forwarding + catch mode</li>
      </ul>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Authenticated (free account)
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">Sign in to get:</p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          <strong className="text-on-surface">Persistent subdomains</strong> — your{' '}
          <code className={code}>--name</code> survives restarts permanently
        </li>
        <li>Up to 3 reserved subdomains (free tier)</li>
        <li>7-day stale cleanup (unused subdomains are released after a week)</li>
      </ul>
      <p className="mt-4 leading-relaxed text-on-surface-variant">To authenticate:</p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal login
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        This opens your browser to complete the sign-in flow via GitHub OAuth (Clerk). Your token is
        stored locally at <code className={code}>~/.workslocal/config.json</code>.
      </p>
      <p className="mt-4 leading-relaxed text-on-surface-variant">To check your auth status:</p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal whoami
      </pre>

      <hr className="my-8 border-outline" />

      {/* ── Use with different frameworks ─────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">
        Use with different frameworks
      </h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        WorksLocal works with any local server — it doesn&apos;t care what framework you&apos;re
        using.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">Next.js</h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        <span className="text-muted"># Terminal 1</span>
        {'\nnpm run dev\n'}
        <span className="text-muted"># → localhost:3000</span>
        {'\n\n'}
        <span className="text-muted"># Terminal 2</span>
        {'\nworkslocal http 3000'}
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Express / Fastify / Koa
      </h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        <span className="text-muted"># Terminal 1</span>
        {'\nnode server.js\n'}
        <span className="text-muted"># → localhost:4000</span>
        {'\n\n'}
        <span className="text-muted"># Terminal 2</span>
        {'\nworkslocal http 4000'}
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Python (Django / Flask / FastAPI)
      </h3>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        <span className="text-muted"># Terminal 1</span>
        {'\npython manage.py runserver 8000\n\n'}
        <span className="text-muted"># Terminal 2</span>
        {'\nworkslocal http 8000'}
      </pre>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Go / Rust / Java / PHP
      </h3>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Same pattern — start your server on a port, point WorksLocal at that port.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── Stop the tunnel ───────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Stop the tunnel</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Press <code className={code}>Ctrl+C</code> in the terminal. The tunnel closes gracefully —
        no orphaned subdomains.
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        <span className="text-muted"># Or from another terminal:</span>
        {'\nworkslocal stop myapp\n\n'}
        <span className="text-muted"># Stop all tunnels:</span>
        {'\nworkslocal stop --all'}
      </pre>

      <hr className="my-8 border-outline" />

      {/* ── JSON output ───────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">
        JSON output for scripts and AI
      </h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Every command supports <code className={code}>--json</code> for machine-readable output:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        workslocal http 3000 --name myapp --json
      </pre>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {`{\n`}
        {`  "tunnelId": "tun_abc123",\n`}
        {`  "publicUrl": "https://myapp.workslocal.exposed",\n`}
        {`  "subdomain": "myapp",\n`}
        {`  "domain": "workslocal.exposed",\n`}
        {`  "localPort": 3000,\n`}
        {`  "inspectorUrl": "http://localhost:4040"\n`}
        {`}`}
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        This enables AI assistants (Claude, Cursor) and scripts to create and manage tunnels
        programmatically.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── Configuration ─────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Configuration</h2>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        WorksLocal stores config in <code className={code}>~/.workslocal/config.json</code>:
      </p>
      <pre className="mt-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
        {`{\n`}
        {`  "anonymousToken": "a1b2c3...",\n`}
        {`  "sessionToken": "eyJ...",\n`}
        {`  "userId": "user_xxx",\n`}
        {`  "serverUrl": "wss://api.workslocal.dev/ws"\n`}
        {`}`}
      </pre>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        You typically never need to edit this file directly.
      </p>

      <h3 className="mt-8 font-headline text-lg font-bold text-on-surface">
        Environment variables
      </h3>
      <div className="mt-4 overflow-x-auto border border-outline">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-outline bg-surface text-left">
              <th className="px-4 py-2 font-medium text-on-surface">Variable</th>
              <th className="px-4 py-2 font-medium text-on-surface">Purpose</th>
              <th className="px-4 py-2 font-medium text-on-surface">Default</th>
            </tr>
          </thead>
          <tbody className="text-on-surface-variant">
            <tr className="border-b border-outline">
              <td className="px-4 py-2 text-primary">WORKSLOCAL_SERVER_URL</td>
              <td className="px-4 py-2">Relay server WebSocket URL</td>
              <td className="px-4 py-2 text-muted">wss://api.workslocal.dev/ws</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-primary">WORKSLOCAL_API_KEY</td>
              <td className="px-4 py-2">API key for authentication</td>
              <td className="px-4 py-2 text-muted">—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-outline" />

      {/* ── How it works ──────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">
        How it works (30-second version)
      </h2>
      <ol className="mt-4 list-decimal space-y-3 pl-6 leading-relaxed text-on-surface-variant">
        <li>The CLI opens a WebSocket to the WorksLocal relay server (on Cloudflare Workers)</li>
        <li>The relay assigns your subdomain and creates a Durable Object for your tunnel</li>
        <li>
          When someone visits your tunnel URL, the request flows:{' '}
          <span className="text-muted">
            browser → Cloudflare edge → Durable Object → WebSocket → your CLI → localhost
          </span>
        </li>
        <li>Your local server responds, and the response flows back the same path</li>
        <li>The CLI captures every request/response in memory for the web inspector</li>
      </ol>
      <p className="mt-4 leading-relaxed text-on-surface-variant">
        Your traffic passes through the relay as encrypted packets. The relay is a &ldquo;dumb
        pipe&rdquo; — request and response bodies never touch server disk. All inspection and
        storage happens locally on your machine.
      </p>

      <hr className="my-8 border-outline" />

      {/* ── Limitations ───────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Limitations</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          <strong className="text-on-surface">HTTP/HTTPS only</strong> — TCP and UDP tunneling are
          not supported (planned for future)
        </li>
        <li>
          <strong className="text-on-surface">No SSE/streaming responses yet</strong> — responses
          are fully buffered before sending (fix coming in next release)
        </li>
        <li>
          <strong className="text-on-surface">10 MB request body limit</strong> — requests larger
          than 10 MB return 413
        </li>
        <li>
          <strong className="text-on-surface">30-second timeout</strong> — if your local server
          doesn&apos;t respond within 30 seconds, the tunnel returns 504
        </li>
        <li>
          <strong className="text-on-surface">Single tunnel domain</strong> — only{' '}
          <code className={code}>workslocal.exposed</code> is available (coming support for more
          domains)
        </li>
        <li>
          <strong className="text-on-surface">No custom domains</strong> — bring-your-own-domain not
          supported yet
        </li>
        <li>
          <strong className="text-on-surface">In-memory request store</strong> — captured requests
          are lost when the CLI exits (SQLite persistence planned)
        </li>
      </ul>

      <hr className="my-8 border-outline" />

      {/* ── Next steps ────────────────────────────────────── */}
      <h2 className="font-headline text-2xl font-bold text-on-surface">Next steps</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-on-surface-variant">
        <li>
          <Link href="/docs/cli" className="text-primary transition-colors hover:text-on-surface">
            CLI Reference
          </Link>{' '}
          — all commands and flags
        </li>
        <li>
          <Link
            href="/docs/web-inspector"
            className="text-primary transition-colors hover:text-on-surface"
          >
            Web Inspector
          </Link>{' '}
          — inspect requests visually
        </li>
        <li>
          <Link
            href="/docs/catch-mode"
            className="text-primary transition-colors hover:text-on-surface"
          >
            Catch Mode
          </Link>{' '}
          — capture webhooks without a server
        </li>
      </ul>
    </article>
  );
}
