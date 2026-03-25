import CopyInstallCommand from '@/components/CopyInstallCommand';

export const metadata = {
  title: 'Pricing | WorksLocal',
  description: 'WorksLocal pricing plans — free and premium options.',
};

export default function PricingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-8 pt-24 pb-16">
      <h1 className="py-4 font-headline text-4xl font-black text-primary">Free</h1>
      <CopyInstallCommand />
    </main>
  );
}
