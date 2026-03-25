import Image from 'next/image';

const Inspector = () => {
  return (
    <section className="bg-surface px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <h2 className="font-headline text-3xl font-bold tracking-tighter text-on-surface">
            Web Inspector
          </h2>
          <p className="text-muted">Replay, inspect, and modify requests on the fly.</p>
        </div>
        <div className="overflow-hidden border border-outline">
          <Image
            src="/inspector.png"
            alt="WorksLocal Web Inspector showing request list and detail panes"
            width={2400}
            height={1350}
            className="w-full"
            quality={100}
            unoptimized
          />
        </div>
      </div>
    </section>
  );
};

export default Inspector;
