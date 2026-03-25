const CatchMode = () => {
  return (
    <section className="bg-background px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center md:mb-16">
          <h2 className="mb-4 font-headline text-4xl font-bold tracking-tighter text-on-surface">
            The "Catch Mode"
          </h2>
          <p className="mx-auto max-w-2xl text-muted">
            No server running yet? No problem. WorksLocal can catch requests in mid-air and store
            them until you're ready to spin up your local environment.
          </p>
        </div>
        <div className="bg-outline p-1">
          <div className="bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-label text-[10px] tracking-widest text-muted uppercase">
                Terminal
              </span>
              <span className="h-2 w-2 rounded-full bg-primary"></span>
            </div>
            <pre className="overflow-x-auto font-mono text-sm leading-relaxed text-on-surface-variant">
              <span className="text-muted">$ </span>
              <span className="text-on-surface">workslocal catch --name stripe-payments</span>
              {'\n\n'}
              <span className="text-muted">
                {'────────────────────────────────────────────────────────────\n\n'}
              </span>
              <span className="text-secondary">✔ Catch mode active!</span>
              {'\n\n'}
              {'Public URL:   '}
              <span className="text-primary">https://stripe-payments.workslocal.exposed</span>
              {'\nInspector:    http://localhost:4040'}
              {'\nReturning:    200 {"ok":true}'}
              {'\nSubdomain:    stripe-payments\n\n'}
              {'Paste the URL in your webhook dashboard.\n'}
              {'All requests appear below and at http://localhost:4040\n\n'}
              <span className="text-muted">{'Press Ctrl+C to stop.\n\n'}</span>
              <span className="text-muted">
                {'────────────────────────────────────────────────────────────\n\n'}
              </span>
              {'POST    / '}
              <span className="text-secondary">200</span>
              {' 1ms\n'}
              {'POST    /get-user '}
              <span className="text-secondary">200</span>
              {' 0ms\n'}
              <span className="animate-pulse text-on-surface">_</span>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CatchMode;
