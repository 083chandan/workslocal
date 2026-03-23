import { getCallbackHtml } from '../templates/callback.js';
import { getLoginHtml } from '../templates/login.js';
import type { Env } from '../types.js';

/**
 * /auth/login - loads Clerk JS, redirects to hosted sign-in.
 *
 * Flow:
 * 1. CLI opens browser → /auth/login?callback=...&state=...
 * 2. Clerk.load() → if already signed in → grab token+email → redirect to CLI
 * 3. If not signed in → redirectToSignIn() → Clerk hosted UI
 * 4. After sign-in → Clerk redirects to /auth/callback
 */
export function handleAuthLoginPage(request: Request, env: Env): Response {
  const url = new URL(request.url);
  const callback = url.searchParams.get('callback') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const pk = env.CLERK_PUBLISHABLE_KEY;

  const afterSignInUrl = `https://api.workslocal.dev/auth/callback?callback=${encodeURIComponent(callback)}&state=${state}`;

  const html = getLoginHtml(pk, callback, state, afterSignInUrl);

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

/**
 * /auth/callback - receives redirect from Clerk after sign-in.
 * Grabs session token + email → redirects to CLI's local callback.
 */
export function handleAuthCallback(request: Request, env: Env): Response {
  const url = new URL(request.url);
  const callback = url.searchParams.get('callback') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const pk = env.CLERK_PUBLISHABLE_KEY;

  const html = getCallbackHtml(pk, callback, state);

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
