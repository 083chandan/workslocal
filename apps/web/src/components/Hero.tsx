const Hero = () => {
  return (
    <>
      <section className="relative flex min-h-217.5 flex-col items-center justify-center overflow-hidden px-6">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="var(--color-outline)"
                  strokeWidth="1"
                ></path>
              </pattern>
            </defs>
            <rect fill="url(#grid)" height="100%" width="100%"></rect>

            <path
              className="opacity-30"
              d="M 100,400 Q 400,400 600,200 T 1100,200"
              fill="none"
              stroke="var(--color-primary)"
              strokeDasharray="4 4"
              strokeWidth="1"
            ></path>
            <path
              className="opacity-30"
              d="M 100,500 Q 400,500 600,700 T 1100,700"
              fill="none"
              stroke="var(--color-secondary)"
              strokeDasharray="4 4"
              strokeWidth="1"
            ></path>

            <circle className="glow-cyan" fill="var(--color-primary)" r="3">
              <animateMotion
                dur="3s"
                path="M 100,400 Q 400,400 600,200 T 1100,200"
                repeatCount="indefinite"
              ></animateMotion>
            </circle>
            <circle className="glow-cyan" fill="var(--color-secondary)" r="3">
              <animateMotion
                begin="1s"
                dur="4s"
                path="M 100,500 Q 400,500 600,700 T 1100,700"
                repeatCount="indefinite"
              ></animateMotion>
            </circle>
          </svg>
        </div>
        <div className="relative z-10 max-w-4xl text-center">
          <h1 className="mb-4 font-headline text-6xl leading-none font-bold tracking-tighter uppercase md:text-8xl">
            It works on my <span className="text-primary">Machine.</span>
          </h1>
          <p className="mb-12 font-mono text-lg tracking-tight text-muted md:text-xl">
            The open-source tunnel built for developers.
          </p>

          <div className="group inline-flex cursor-pointer items-center gap-4 border border-outline bg-surface p-2 transition-colors hover:border-primary">
            <div className="flex items-center gap-3 border border-outline bg-background px-4 py-2">
              <span className="font-mono text-success">$</span>
              <code className="font-mono text-on-background">npm install -g workslocal</code>
            </div>
            <button className="flex items-center gap-2 pr-4 font-mono text-xs text-muted uppercase transition-colors group-hover:text-primary">
              <span className="material-symbols-outlined text-sm">content_copy</span>
              Copy
            </button>
          </div>
          <div className="mt-16 flex justify-center gap-12 font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-success"></span> Localhost:3000
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-primary"></span> Relay-US-East
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-warning"></span> Public-URL-Active
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
export default Hero;
