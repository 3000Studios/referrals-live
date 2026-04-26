export const TransactionTable = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-muted text-sm">
        No conversions tracked yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Event</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Amount</th>
            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {data.map((tx, i) => (
            <tr key={i} className="hover:bg-white/5 transition-colors">
              <td className="p-4 text-sm text-slate-300">
                {new Date(tx.created_at).toLocaleDateString()}
              </td>
              <td className="p-4">
                <p className="text-sm font-medium text-white">Referral Signup</p>
                <p className="text-xs text-muted">Code: {tx.code}</p>
              </td>
              <td className="p-4 text-sm font-semibold text-white">
                +${(tx.amount / 100).toFixed(2)}
              </td>
              <td className="p-4">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                  ${tx.status === 'completed' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-amber-500/20 text-amber-400 animate-pulse'}
                `}>
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
