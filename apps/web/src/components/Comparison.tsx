const Comparison = () => {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-24">
      <h2 className="mb-8 text-center font-headline text-4xl font-bold tracking-tighter uppercase md:mb-16">
        The "Zero Bullshit" Comparison
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-sm">
          <thead>
            <tr className="border-b border-outline text-left">
              <th className="py-4 text-muted uppercase">Feature (Free Tier)</th>
              <th className="px-3 py-4 uppercase md:px-6">Ngrok</th>
              <th className="px-3 py-4 text-primary uppercase md:px-6">WorksLocal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline">
            <tr>
              <td className="py-4 text-muted uppercase md:py-6">Subdomain</td>
              <td className="px-3 py-4 text-error md:px-6 md:py-6">Random / Changes</td>
              <td className="px-3 py-4 text-success md:px-6 md:py-6">Fixed / Persistent</td>
            </tr>
            <tr>
              <td className="py-4 text-muted uppercase md:py-6">Bandwidth</td>
              <td className="px-3 py-4 md:px-6 md:py-6">1GB/Month</td>
              <td className="px-3 py-4 text-success md:px-6 md:py-6">Unlimited (Local)</td>
            </tr>
            <tr>
              <td className="py-4 text-muted uppercase md:py-6">Privacy</td>
              <td className="px-3 py-4 md:px-6 md:py-6">I have not Idea!</td>
              <td className="px-3 py-4 text-success md:px-6 md:py-6">Dumb-Pipe P2P</td>
            </tr>
            <tr>
              <td className="py-4 text-muted uppercase md:py-6">Auth Required</td>
              <td className="px-3 py-4 md:px-6 md:py-6">Yes (Mandatory)</td>
              <td className="px-3 py-4 text-success md:px-6 md:py-6">No (Optional)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Comparison;
