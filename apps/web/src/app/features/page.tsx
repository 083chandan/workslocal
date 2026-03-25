import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Explore WorksLocal features — HTTPS tunneling, web request inspector, catch mode for webhooks, AI integration, and more.',
  alternates: { canonical: '/features' },
  openGraph: {
    title: 'Features | WorksLocal',
    description: 'HTTPS tunneling, web inspector, catch mode, AI integration, and more.',
    url: '/features',
  },
};

export default function FeaturesPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 pt-20 pb-12 md:px-8 md:pt-24 md:pb-16">
      <h1 className="font-headline text-4xl font-black text-on-surface">Features</h1>
      <p className="mt-4 max-w-md text-center font-mono text-sm tracking-wide text-muted">
        Coming soon — a detailed look at everything WorksLocal can do.
      </p>
    </main>
  );
}
