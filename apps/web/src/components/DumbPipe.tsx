const DumbPipe = () => {
  return (
    <section className="bg-surface py-16 md:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 md:gap-16 md:px-8 lg:grid-cols-2">
        <div className="relative flex aspect-video items-center justify-center overflow-hidden border border-outline bg-background">
          <div className="hatch-pattern absolute inset-0 opacity-20"></div>
          <div className="relative z-10 flex items-center gap-6 md:gap-12">
            <div className="flex h-14 w-14 items-center justify-center border border-primary md:h-20 md:w-20">
              <span className="material-symbols-outlined text-3xl text-primary md:text-4xl">
                dns
              </span>
            </div>
            <div className="relative h-px w-16 bg-primary md:w-32">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 font-mono text-[8px] text-muted">
                ENCRYPTED
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center border border-muted opacity-50 md:h-20 md:w-20">
              <span className="material-symbols-outlined text-3xl text-muted md:text-4xl">
                visibility_off
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="font-headline text-4xl font-bold text-on-surface">
            The 'Dumb Pipe' Principle
          </h2>
          <p className="leading-relaxed text-muted">
            We believe your data is none of our business. WorksLocal operates as a pure relay. Our
            servers never terminate your SSL connection; they simply route raw TCP packets between
            the public edge and your local agent.
          </p>
          <div className="border-l-2 border-primary bg-background p-4">
            <p className="font-mono text-xs text-on-surface">
              "If it's not encrypted on your machine, it's not on our wires."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DumbPipe;
