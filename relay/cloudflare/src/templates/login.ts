/**
 * Login page HTML template.
 * Loads Clerk JS, checks for existing session, or redirects to hosted sign-in.
 */
export function getLoginHtml(
  pk: string,
  callback: string,
  state: string,
  afterSignInUrl: string,
): string {
  return `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>WorksLocal - Sign In</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui; background: #0a0a0a; color: #fff; display: flex;
           justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    #app { width: 400px; text-align: center; }
    h1 { font-size: 1.5rem; margin-bottom: 2rem; }
    .loading { color: #888; }
    .error { color: #ef4444; margin-top: 1rem; display: none; }
  </style>
</head><body>
  <div id="app">
    <h1>WorksLocal</h1>
    <p class="loading" id="loading">Redirecting to sign-in...</p>
    <p class="error" id="error"></p>
  </div>
  <script
    async
    crossorigin="anonymous"
    data-clerk-publishable-key="${pk}"
    src="https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"
    type="text/javascript"
  ></script>
  <script>
    var CALLBACK = decodeURIComponent('${encodeURIComponent(callback)}');
    var STATE = '${state}';
    var AFTER_SIGN_IN = '${afterSignInUrl}';

    window.addEventListener('load', async function() {
      try {
        await window.Clerk.load();

        if (window.Clerk.user) {
          var token = await window.Clerk.session.getToken();
          var email = window.Clerk.user.primaryEmailAddress
            ? window.Clerk.user.primaryEmailAddress.emailAddress
            : '';
          window.location.href = CALLBACK
            + '?token=' + encodeURIComponent(token)
            + '&state=' + STATE
            + '&email=' + encodeURIComponent(email);
          return;
        }

        window.Clerk.redirectToSignIn({
          afterSignInUrl: AFTER_SIGN_IN,
        });
      } catch (err) {
        document.getElementById('loading').style.display = 'none';
        var errorEl = document.getElementById('error');
        errorEl.style.display = 'block';
        errorEl.textContent = 'Error: ' + err.message;
      }
    });
  </script>
</body></html>`;
}
