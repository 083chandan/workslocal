import { exec } from 'node:child_process';
import crypto from 'node:crypto';
import http from 'node:http';

import chalk from 'chalk';
import ora from 'ora';

import { readConfig, writeConfig, getServerUrl } from '../utils/config.js';

// ─── Auth result from browser callback ───────────────────

interface AuthCallbackResult {
  token: string;
  email: string;
}

// ─── Login Command ───────────────────────────────────────

/**
 * workslocal login
 *
 * Opens browser to Clerk sign-in page (hosted by our Worker).
 * Starts a local HTTP server to receive the callback with JWT + email.
 * Stores the session token in ~/.workslocal/config.json.
 */
export async function loginCommand(): Promise<void> {
  const config = readConfig();

  if (config.sessionToken) {
    console.log(chalk.yellow('Already logged in. Run "workslocal logout" to sign out first.'));
    return;
  }

  const spinner = ora('Waiting for browser authentication...').start();

  try {
    const { token, email } = await startAuthFlow();

    spinner.text = 'Generating API key...';

    // Use the short-lived JWT to create a long-lived API key
    const serverUrl = getServerUrl();
    const httpBase = serverUrl
      .replace('wss://', 'https://')
      .replace('ws://', 'http://')
      .replace(/\/ws$/, '');

    const res = await fetch(`${httpBase}/api/v1/keys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: `CLI login ${new Date().toISOString().slice(0, 10)}` }),
    });

    if (!res.ok) {
      const errData = (await res.json()) as { error?: { message?: string } };
      throw new Error(errData.error?.message ?? `API key creation failed (${String(res.status)})`);
    }

    const data = (await res.json()) as { data: { key: string; id: string } };

    // Store the API key (long-lived, not the JWT)
    writeConfig({
      ...config,
      sessionToken: data.data.key, // wl_k_... (never expires)
      apiKeyId: data.data.id, // For revocation on logout
      email,
    });

    spinner.succeed(`Logged in as ${chalk.bold(email || 'authenticated user')}`);
  } catch (err) {
    spinner.fail(`Login failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─── Auth Flow ───────────────────────────────────────────

/**
 * Start local HTTP server, open browser, wait for callback with token + email.
 *
 * Flow:
 * 1. Start HTTP server on random port (9876-9975)
 * 2. Generate random state for CSRF protection
 * 3. Open browser to https://api.workslocal.dev/auth/login?callback=...&state=...
 * 4. User signs in with GitHub via Clerk
 * 5. Clerk redirects to /auth/callback on our Worker
 * 6. Worker grabs JWT + email from Clerk, redirects to localhost:{port}/callback
 * 7. Local server receives token + email, resolves promise
 * 8. Browser shows "Logged in - close this tab"
 */
function startAuthFlow(): Promise<AuthCallbackResult> {
  return new Promise((resolve, reject) => {
    const port = 9876 + Math.floor(Math.random() * 100);
    const state = crypto.randomBytes(16).toString('hex');
    let timeoutTimer: NodeJS.Timeout | null = null;

    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${String(port)}`);

      if (url.pathname === '/callback') {
        const token = url.searchParams.get('token');
        const returnedState = url.searchParams.get('state');
        const email = url.searchParams.get('email') ?? '';

        if (returnedState !== state) {
          res.writeHead(400, { 'content-type': 'text/html' });
          res.end(
            '<html><body style="font-family:system-ui;text-align:center;padding:60px;"><h1>Invalid state</h1></body></html>',
          );
          reject(new Error('State mismatch'));
          if (timeoutTimer) clearTimeout(timeoutTimer);
          server.close();
          return;
        }

        if (!token) {
          res.writeHead(400, { 'content-type': 'text/html' });
          res.end(
            '<html><body style="font-family:system-ui;text-align:center;padding:60px;"><h1>No token received</h1></body></html>',
          );
          reject(new Error('No token in callback'));
          if (timeoutTimer) clearTimeout(timeoutTimer);
          server.close();
          return;
        }

        res.writeHead(200, { 'content-type': 'text/html' });
        res.end(`<html><body style="font-family:system-ui;text-align:center;padding:60px;">
          <h1> Logged in to WorksLocal</h1>
          <p style="color:#888;">You can close this tab and return to your terminal.</p>
        </body></html>`);

        if (timeoutTimer) clearTimeout(timeoutTimer);
        resolve({ token, email });
        server.close();
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });
    server.listen(port, () => {
      const serverUrl = getServerUrl();
      // Convert wss://api.workslocal.dev/ws → https://api.workslocal.dev
      const httpBase = serverUrl
        .replace('wss://', 'https://')
        .replace('ws://', 'http://')
        .replace(/\/ws$/, '');

      const callbackUrl = encodeURIComponent(`http://localhost:${String(port)}/callback`);
      const loginUrl = `${httpBase}/auth/login?callback=${callbackUrl}&state=${state}`;

      console.log(chalk.dim('\nOpening browser to sign in...\n'));
      console.log(chalk.dim("If the browser doesn't open, visit:"));
      console.log(chalk.cyan(loginUrl));
      console.log('');

      openBrowser(loginUrl);
    });

    timeoutTimer = setTimeout(() => {
      server.close();
      reject(new Error('Login timed out after 2 minutes'));
    }, 120_000);

    // Don't let the timer keep the process alive
    timeoutTimer.unref();
  });
}

// ─── Browser opener ──────────────────────────────────────

function openBrowser(url: string): void {
  const platform = process.platform;
  let cmd: string;

  if (platform === 'darwin') {
    cmd = 'open';
  } else if (platform === 'win32') {
    cmd = 'start';
  } else {
    cmd = 'xdg-open';
  }

  exec(`${cmd} "${url}"`, (err) => {
    if (err) {
      // Silently fail - user can copy the URL from terminal
    }
  });
}
