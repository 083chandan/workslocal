const Footer = () => {
  return (
    <footer className="flex w-full flex-col items-center justify-between gap-4 border-t border-outline bg-background px-4 py-8 md:flex-row md:px-8 md:py-12">
      <div className="flex flex-col gap-2">
        <span className="font-headline text-sm font-bold text-on-surface">WorksLocal</span>
        <p className="font-mono text-[10px] tracking-widest text-muted uppercase">
          © 2026 WorksLocal.
        </p>
      </div>
      <div className="flex gap-8">
        <a
          className="font-mono text-xs tracking-widest text-muted uppercase transition-colors hover:text-primary"
          href="https://github.com/083chandan/workslocal"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a
          className="font-mono text-xs tracking-widest text-muted uppercase transition-colors hover:text-primary"
          href="https://www.npmjs.com/package/workslocal"
          target="_blank"
          rel="noopener noreferrer"
        >
          NPM
        </a>
        {/* <a
          className="font-mono text-xs tracking-widest text-muted uppercase transition-colors hover:text-primary"
          href="#"
        >
          Twitter
        </a> */}
      </div>
    </footer>
  );
};

export default Footer;
