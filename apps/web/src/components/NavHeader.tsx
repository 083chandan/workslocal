'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navLinks = [
  { href: '/docs', label: 'Docs' },
  // { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/changelog', label: 'Changelog' },
];

const NavHeader = () => {
  const [version, setVersion] = useState('...');
  const pathname = usePathname();

  useEffect(() => {
    fetch('https://registry.npmjs.org/workslocal/latest')
      .then((res) => res.json())
      .then((data: { version?: string }) => {
        if (data.version) setVersion(data.version);
      })
      .catch(() => setVersion('0.0.0'));
  }, []);

  return (
    <nav className="fixed top-0 left-0 z-50 flex w-full items-center justify-between bg-surface/80 px-8 py-4 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-2xl font-black text-primary"
        >
          <Image src="/ws_logo.png" width={36} height={36} alt="logo" />
          <span>WorksLocal</span>
        </Link>
        <div className="hidden gap-6 font-mono text-xs tracking-widest text-on-surface-variant uppercase md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={
                (href === '/' ? pathname === href : pathname.startsWith(href))
                  ? 'border-b-2 border-primary pb-1 text-primary'
                  : 'transition-colors hover:text-on-surface'
              }
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 font-mono text-xs">
        <a
          href="https://www.npmjs.com/package/workslocal"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-secondary/20 bg-secondary/10 px-2 py-1 text-secondary transition-colors hover:bg-secondary/20"
        >
          v{version}
        </a>
      </div>
    </nav>
  );
};

export default NavHeader;
