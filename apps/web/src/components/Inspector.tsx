const Inspector = () => {
  return (
    <section className="bg-surface px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <h2 className="font-headline text-3xl font-bold tracking-tighter text-on-surface">
            Functional Web Inspector
          </h2>
          <p className="text-muted">Replay, inspect, and modify requests on the fly.</p>
        </div>
        <div className="grid h-125 overflow-hidden border border-outline lg:grid-cols-3">
          <div className="col-span-1 overflow-y-auto border-r border-outline bg-background">
            <div className="flex justify-between border-b border-outline bg-surface p-3 font-label text-[10px] tracking-widest uppercase">
              <span>Request History</span>
              <span className="text-primary">Live</span>
            </div>
            <div className="divide-y divide-outline">
              <div className="flex cursor-pointer items-center justify-between bg-outline/30 p-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="bg-secondary px-1.5 py-0.5 font-label text-[10px] font-bold text-on-secondary">
                      200
                    </span>
                    <span className="font-label text-xs text-on-surface">
                      POST /webhooks/stripe
                    </span>
                  </div>
                  <span className="font-label text-[10px] text-muted uppercase">
                    12:45:01 PM • 45ms
                  </span>
                </div>
                <span className="material-symbols-outlined text-muted">chevron_right</span>
              </div>
              <div className="flex cursor-pointer items-center justify-between p-4 hover:bg-outline/10">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="bg-error px-1.5 py-0.5 font-label text-[10px] font-bold text-on-error">
                      500
                    </span>
                    <span className="font-label text-xs text-on-surface">GET /api/v1/user</span>
                  </div>
                  <span className="font-label text-[10px] text-muted uppercase">
                    12:44:58 PM • 120ms
                  </span>
                </div>
                <span className="material-symbols-outlined text-muted">chevron_right</span>
              </div>

              <div className="flex cursor-pointer items-center justify-between p-4 hover:bg-outline/10">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="bg-secondary px-1.5 py-0.5 font-label text-[10px] font-bold text-on-secondary">
                      200
                    </span>
                    <span className="font-label text-xs text-on-surface">
                      POST /webhooks/github
                    </span>
                  </div>
                  <span className="font-label text-[10px] text-muted uppercase">
                    12:44:30 PM • 32ms
                  </span>
                </div>
                <span className="material-symbols-outlined text-muted">chevron_right</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 overflow-y-auto bg-surface">
            <div className="flex gap-4 border-b border-outline p-4">
              <button className="border-b border-primary font-label text-[10px] tracking-widest text-primary uppercase">
                Headers
              </button>
              <button className="font-label text-[10px] tracking-widest text-muted uppercase">
                Payload
              </button>
              <button className="font-label text-[10px] tracking-widest text-muted uppercase">
                Response
              </button>
            </div>
            <div className="space-y-4 p-6 font-label text-xs">
              <div className="grid grid-cols-4 gap-4">
                <span className="text-muted">Host</span>
                <span className="col-span-3 text-on-surface">localhost:3000</span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <span className="text-muted">User-Agent</span>
                <span className="col-span-3 text-on-surface">
                  Stripe/1.0 (+https://stripe.com/docs/webhooks)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <span className="text-muted">Content-Type</span>
                <span className="col-span-3 text-on-surface">application/json</span>
              </div>
              <div className="grid grid-cols-4 gap-4 border-t border-outline pt-4">
                <span className="text-muted">Signature</span>
                <span className="col-span-3 break-all text-primary">
                  t=1623456789,v1=9876543210abcdef...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Inspector;
