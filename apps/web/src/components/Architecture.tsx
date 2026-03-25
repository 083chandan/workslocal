const Architecture = () => {
  return (
    <section className="mx-auto max-w-7xl px-8 py-32 text-center">
      <span className="font-mono text-xs tracking-widest text-primary uppercase">
        Global Infrastructure
      </span>
      <h2 className="mb-16 font-headline text-4xl font-bold text-on-surface">
        Built on Cloudflare Workers
      </h2>
      <div className="relative mx-auto max-w-4xl">
        <div className="grid grid-cols-3 gap-8">
          <div className="border border-outline bg-surface p-8">
            <p className="mb-4 font-mono text-xs text-muted">CLIENT</p>
            <span className="material-symbols-outlined mb-2 text-3xl">devices</span>
            <p className="text-sm font-bold">Local Agent</p>
          </div>
          <div className="relative z-10 border border-primary bg-background p-8">
            <p className="mb-4 font-mono text-xs text-primary">RELAY</p>
            <span
              className="material-symbols-outlined mb-2 text-3xl text-primary"
              data-weight="fill"
            >
              cloud_sync
            </span>
            <p className="text-sm font-bold">Workers Edge</p>
            <div className="active-glow pointer-events-none absolute -inset-1 border border-primary opacity-20"></div>
          </div>
          <div className="border border-outline bg-surface p-8">
            <p className="mb-4 font-mono text-xs text-muted">PUBLIC</p>
            <span className="material-symbols-outlined mb-2 text-3xl">language</span>
            <p className="text-sm font-bold">Global Internet</p>
          </div>
        </div>

        <div className="absolute top-1/2 left-[33%] -z-10 hidden h-px w-[33%] bg-primary md:block"></div>
        <div className="absolute top-1/2 right-[33%] -z-10 hidden h-px w-[33%] bg-primary md:block"></div>
      </div>
      <p className="mx-auto mt-12 max-w-2xl text-sm leading-relaxed text-muted">
        By leveraging Cloudflare's global network, we minimize latency by routing your traffic
        through the nearest edge node to your local machine.
      </p>
    </section>
  );
};

export default Architecture;
