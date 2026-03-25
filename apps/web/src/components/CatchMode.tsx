const CatchMode = () => {
  return (
    <section className="bg-background px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-headline text-4xl font-bold tracking-tighter text-on-surface">
            The "Catch Mode"
          </h2>
          <p className="mx-auto max-w-2xl text-muted">
            No server running yet? No problem. WorksLocal can catch requests in mid-air and store
            them until you're ready to spin up your local environment.
          </p>
        </div>
        <div className="grid gap-1 bg-outline px-4 py-8 md:grid-cols-2">
          <div className="flex h-80 flex-col bg-background p-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-label text-[10px] tracking-widest text-muted uppercase">
                Terminal 1: Controller
              </span>
              <span className="h-2 w-2 rounded-full bg-primary"></span>
            </div>
            <div className="grow space-y-2 overflow-hidden font-label text-sm">
              <div className="text-muted">$ workslocal catch --port 8080</div>
              <div className="text-primary">
                ? Waiting for incoming requests on black-mesa-12.workslocal.sh
              </div>
              <div className="pt-4 text-secondary">
                ✓ [12:50:22] Caught POST from Stripe (4.2kb)
              </div>
              <div className="text-secondary">✓ [12:50:24] Caught GET from Postman (1.1kb)</div>
              <div className="animate-pulse text-on-surface">_</div>
            </div>
          </div>
          <div className="flex h-80 flex-col bg-background p-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-label text-[10px] tracking-widest text-muted uppercase">
                Terminal 2: Local Server
              </span>
              <span className="h-2 w-2 rounded-full bg-error"></span>
            </div>
            <div className="flex grow items-center justify-center border border-dashed border-outline font-label text-sm text-muted italic">
              [Server Offline]
            </div>
            <div className="pt-4 font-label text-[10px] text-primary uppercase">
              WorksLocal is holding 2 requests in queue...
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CatchMode;
