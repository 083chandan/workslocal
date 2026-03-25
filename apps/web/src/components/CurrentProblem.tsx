'use client';

import { useEffect, useRef, useState } from 'react';

const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
const target = 'Again.';

function getRandomText(length: number) {
  return Array.from(
    { length },
    () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)],
  ).join('');
}

const ScrambleText = () => {
  const [text, setText] = useState(target);
  const [isScrambling, setIsScrambling] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    const runCycle = () => {
      // Start scrambling
      setIsScrambling(true);
      interval = setInterval(() => {
        setText(getRandomText(target.length));
      }, 50);

      // After 2s, resolve back to "Again."
      timeout = setTimeout(() => {
        clearInterval(interval);
        setIsScrambling(false);

        // Decode letter by letter
        let i = 0;
        interval = setInterval(() => {
          i++;
          setText(target.slice(0, i) + getRandomText(target.length - i));
          if (i >= target.length) {
            clearInterval(interval);
            setText(target);
            // Wait 2s then restart
            timeout = setTimeout(runCycle, 2000);
          }
        }, 80);
      }, 2000);
    };

    // Initial wait before first scramble
    timeout = setTimeout(runCycle, 2000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <span
      className={`inline-block min-w-[4ch] font-mono text-error italic ${isScrambling ? 'opacity-80' : ''}`}
    >
      {text}
    </span>
  );
};

const terminalLines = [
  { text: 'Tunnel expired.', className: 'text-error', delay: 0 },
  {
    text: "Session 'free_user_882' has reached the 2-hour limit.",
    className: 'text-on-surface-variant',
    delay: 600,
  },
  {
    text: 'Upgrade to Pro to maintain persistent URLs.',
    className: 'text-on-surface-variant',
    delay: 1200,
    renderText: (
      <>
        Upgrade to <span className="text-primary underline">Pro</span> to maintain persistent URLs.
      </>
    ),
  },
  { text: '... restarting tunnel ...', className: 'pt-4 text-on-surface opacity-30', delay: 2200 },
  {
    text: 'NEW URL: https://b492-192-22-10.ngrok-free.app',
    className: 'text-secondary',
    delay: 3400,
  },
  {
    text: 'ERROR: Webhook provider failed to deliver. 404 Not Found.',
    className: 'mt-4 text-error',
    delay: 4600,
  },
];

const TerminalLine = ({
  line,
  isVisible,
}: {
  line: (typeof terminalLines)[number];
  isVisible: boolean;
}) => {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const fullText = line.text;

  useEffect(() => {
    if (!isVisible) return;
    const startTimeout = setTimeout(() => setStarted(true), line.delay);
    return () => clearTimeout(startTimeout);
  }, [isVisible, line.delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [started, fullText]);

  if (!started) return null;

  const done = displayed.length >= fullText.length;

  return (
    <div className={line.className}>
      {done && line.renderText ? line.renderText : displayed}
      {!done && <span className="animate-pulse">▌</span>}
    </div>
  );
};

const CurrentProblem = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="border-y border-outline px-6 py-12 md:px-16 md:py-24 lg:px-24">
      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
        <div>
          <h2 className="mb-6 font-headline text-4xl font-bold">
            Your ngrok URL changed. <ScrambleText />
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
        <div
          ref={containerRef}
          className="min-h-[180px] space-y-2 border border-outline bg-surface p-4 font-label text-xs md:p-8"
        >
          {terminalLines.map((line, i) => (
            <TerminalLine key={i} line={line} isVisible={inView} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CurrentProblem;
