import Image from 'next/image';

const NavHeader = () => {
  return (
    <nav className="fixed top-0 left-0 z-50 flex w-full items-center justify-between bg-surface/80 px-8 py-4 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-mono text-2xl font-black text-primary">
          <Image src="/ws_logo.png" width={36} height={36} alt="logo"></Image>
          <span>WorksLocal</span>
        </div>
        <div className="hidden gap-6 font-mono text-xs tracking-widest text-on-surface-variant uppercase md:flex">
          <a className="border-b-2 border-primary pb-1 text-primary" href="#">
            Docs
          </a>
          <a className="transition-colors hover:text-on-surface" href="#">
            Features
          </a>
          <a className="transition-colors hover:text-on-surface" href="#">
            Pricing
          </a>
          <a className="transition-colors hover:text-on-surface" href="#">
            Changelog
          </a>
        </div>
      </div>
      <div className="flex items-center gap-4 font-mono text-xs">
        <span className="border border-secondary/20 bg-secondary/10 px-2 py-1 text-secondary">
          v0.1.1
        </span>
      </div>
    </nav>
  );
};

export default NavHeader;
