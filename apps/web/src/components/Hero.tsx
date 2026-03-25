import CopyInstallCommand from './CopyInstallCommand';

const Hero = () => {
  return (
    <>
      <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-4 pt-16 md:min-h-217.5 md:px-6">
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

              {/* Bright grid patterns revealed near each circle */}
              <pattern height="40" id="grid-primary" patternUnits="userSpaceOnUse" width="40">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="1.5"
                ></path>
              </pattern>
              <pattern height="40" id="grid-secondary" patternUnits="userSpaceOnUse" width="40">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="var(--color-secondary)"
                  strokeWidth="1.5"
                ></path>
              </pattern>

              {/* Soft radial reveals used as clip for the bright grids */}
              <radialGradient id="reveal-1">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="60%" stopColor="white" stopOpacity="0.3" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="reveal-2">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="60%" stopColor="white" stopOpacity="0.3" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>

              {/* Masks that move with the circles to reveal bright grid only nearby */}
              <mask id="mask-1">
                <circle r="100" fill="url(#reveal-1)">
                  <animateMotion
                    dur="3s"
                    path="M 0,400 Q 500,400 1000,200 T 2000,200"
                    repeatCount="indefinite"
                  ></animateMotion>
                </circle>
              </mask>
              <mask id="mask-2">
                <circle r="100" fill="url(#reveal-2)">
                  <animateMotion
                    begin="1s"
                    dur="4s"
                    path="M 0,500 Q 500,500 1000,700 T 2000,700"
                    repeatCount="indefinite"
                  ></animateMotion>
                </circle>
              </mask>
            </defs>

            {/* Base dim grid */}
            <rect fill="url(#grid)" height="100%" width="100%"></rect>

            {/* Bright colored grids revealed only around each moving circle */}
            <rect
              fill="url(#grid-primary)"
              height="100%"
              width="100%"
              mask="url(#mask-1)"
              opacity="0.9"
            ></rect>
            <rect
              fill="url(#grid-secondary)"
              height="100%"
              width="100%"
              mask="url(#mask-2)"
              opacity="0.9"
            ></rect>

            <path
              className="opacity-30"
              d="M 0,400 Q 500,400 1000,200 T 2000,200"
              fill="none"
              stroke="var(--color-primary)"
              strokeDasharray="4 4"
              strokeWidth="1"
            ></path>
            <path
              className="opacity-30"
              d="M 0,500 Q 500,500 1000,700 T 2000,700"
              fill="none"
              stroke="var(--color-secondary)"
              strokeDasharray="4 4"
              strokeWidth="1"
            ></path>

            <circle fill="var(--color-primary)" r="3">
              <animateMotion
                dur="3s"
                path="M 0,400 Q 500,400 1000,200 T 2000,200"
                repeatCount="indefinite"
              ></animateMotion>
            </circle>
            <circle fill="var(--color-secondary)" r="3">
              <animateMotion
                begin="1s"
                dur="4s"
                path="M 0,500 Q 500,500 1000,700 T 2000,700"
                repeatCount="indefinite"
              ></animateMotion>
            </circle>
          </svg>
        </div>
        <div className="relative z-10 max-w-4xl text-center">
          <h1 className="mb-4 font-headline text-4xl leading-none font-bold tracking-tighter uppercase sm:text-6xl md:text-8xl">
            Develop Locally <br />
            <span className="text-primary">Expose Securely.</span>
          </h1>
          <p className="mb-8 font-mono text-base tracking-tight text-muted sm:text-lg md:mb-12 md:text-xl">
            The open-source tunnel built for developers.
            <br />
            No configuration, just tunnels.
          </p>

          <CopyInstallCommand />
          <div className="mt-16 flex justify-center">
            <a
              href="https://github.com/083chandan/workslocal"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-mono text-xs tracking-widest text-muted uppercase transition-colors hover:text-primary"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </section>
    </>
  );
};
export default Hero;
