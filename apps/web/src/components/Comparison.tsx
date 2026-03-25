const Comparison = () => {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24">
      <h2 className="mb-16 text-center font-headline text-4xl font-bold tracking-tighter uppercase">
        The "Zero Bullshit" Comparison
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-sm">
          <thead>
            <tr className="border-b border-outline text-left">
              <th className="py-4 text-muted uppercase">Feature (Free Tier)</th>
              <th className="px-6 py-4 uppercase">Ngrok</th>
              <th className="px-6 py-4 text-primary uppercase">WorksLocal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline">
            <tr>
              <td className="py-6 text-muted uppercase">Subdomain</td>
              <td className="px-6 py-6 text-error">Random / Changes</td>
              <td className="px-6 py-6 text-success">Fixed / Persistent</td>
            </tr>
            <tr>
              <td className="py-6 text-muted uppercase">Bandwidth</td>
              <td className="px-6 py-6">1GB/Month</td>
              <td className="px-6 py-6 text-success">Unlimited (Local)</td>
            </tr>
            <tr>
              <td className="py-6 text-muted uppercase">Privacy</td>
              <td className="px-6 py-6">Data Centralized</td>
              <td className="px-6 py-6 text-success">Dumb-Pipe P2P</td>
            </tr>
            <tr>
              <td className="py-6 text-muted uppercase">Auth Required</td>
              <td className="px-6 py-6">Yes (Mandatory)</td>
              <td className="px-6 py-6 text-success">No (Optional)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Comparison;
