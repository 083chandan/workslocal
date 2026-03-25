import type { Metadata } from 'next';

import CopyInstallCommand from '@/components/CopyInstallCommand';

export const metadata: Metadata = {
  title: 'Free',
  description:
    'WorksLocal is 100% free and open source. No trials, no bandwidth caps, no feature gates. MIT licensed, forever free.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing | WorksLocal',
    description: 'WorksLocal is 100% free and open source. MIT licensed, forever free.',
    url: '/pricing',
  },
};

export default function PricingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 pt-20 pb-12 md:px-8 md:pt-24 md:pb-16">
      <h1 className="py-4 font-headline text-4xl font-black text-primary">Free</h1>
      <CopyInstallCommand />
    </main>
  );
}
