const CurrentProblem = () => {
  return (
    <section className="border-y border-outline px-24 py-24">
      <div className="grid items-center gap-16 md:grid-cols-2">
        <div>
          <h2 className="mb-6 font-headline text-4xl font-bold">
            Your ngrok URL changed.
            <span className="text-error italic">Again.</span>
          </h2>
          <p className="mb-8 leading-relaxed text-on-surface-variant">
            The modern developer experience shouldn't involve logging into a dashboard just to test
            a webhook. We built WorksLocal to solve the friction of temporary tunnels.
          </p>
          <ul className="space-y-4 font-label text-sm">
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-error" data-icon="close">
                close
              </span>
              <span className="text-on-surface-variant">
                No account setup required for basic tunnels.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-error" data-icon="close">
                close
              </span>
              <span className="text-on-surface-variant">
                No proprietary binaries tracking your traffic.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-error" data-icon="close">
                close
              </span>
              <span className="text-on-surface-variant">
                No forced upgrades when you hit 5 requests/min.
              </span>
            </li>
          </ul>
        </div>
        <div className="space-y-2 border border-outline bg-surface p-8 font-label text-xs">
          <div className="text-error">[CRITICAL] Tunnel expired.</div>
          <div className="text-on-surface-variant">
            Session 'free_user_882' has reached the 2-hour limit.
          </div>
          <div className="text-on-surface-variant">
            Upgrade to <span className="text-primary underline">Pro</span> to maintain persistent
            URLs.
          </div>
          <div className="pt-4 text-on-surface opacity-30">... restarting tunnel ...</div>
          <div className="text-secondary">NEW URL: https://b492-192-22-10.ngrok-free.app</div>
          <div className="mt-4 text-error">
            ERROR: Webhook provider failed to deliver. 404 Not Found.
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurrentProblem;
