'use client';

import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

const navLinks = [
  { href: '/', label: 'Home', mobileOnly: true },
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
    <nav className="fixed top-0 left-0 z-50 flex w-full items-center justify-between bg-surface/80 px-4 py-4 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-4 md:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-xl font-black text-primary md:text-2xl"
        >
          <Image src="/ws_logo.png" width={36} height={36} alt="logo" />
          <span>WorksLocal</span>
        </Link>
        <div className="hidden gap-6 font-mono text-xs tracking-widest text-on-surface-variant uppercase md:flex">
          {navLinks
            .filter((l) => !l.mobileOnly)
            .map(({ href, label }) => (
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
      <div className="flex items-center gap-3">
        <a
          href="https://www.npmjs.com/package/workslocal"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-secondary/20 bg-secondary/10 px-2 py-1 font-mono text-xs text-secondary transition-colors hover:bg-secondary/20"
        >
          v{version}
        </a>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger className="flex items-center justify-center p-1 text-on-surface-variant transition-colors hover:text-on-surface md:hidden">
            <Menu size={22} />
          </SheetTrigger>
          <SheetContent side="right" className="bg-surface pt-12">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Site navigation links</SheetDescription>
            <nav className="flex flex-col gap-6 px-6">
              {navLinks.map(({ href, label }) => (
                <SheetClose key={href} asChild>
                  <Link
                    href={href}
                    className={`font-mono text-sm tracking-widest uppercase ${
                      (href === '/' ? pathname === href : pathname.startsWith(href))
                        ? 'text-primary'
                        : 'text-on-surface-variant transition-colors hover:text-on-surface'
                    }`}
                  >
                    {label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default NavHeader;
