// Standardized "3000-card" styling for portfolio-wide consistency
const Card = ({ title, value, subtext, status }: any) => {
  const isPending = status === 'pending';
  
  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 
      ${isPending 
        ? 'border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
        : 'border-white/10 bg-white/5 dark:border-slate-800 dark:bg-slate-900'}
    `}>
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <h3 className="text-3xl font-bold mt-2 text-white">{value}</h3>
      <p className="text-xs mt-1 text-muted">{subtext}</p>
    </div>
  );
};

export const StatsGrid = ({ stats }: any) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card 
        title="Total Clicks" 
        value={stats?.clicks || 0} 
        subtext="Tracking live traffic" 
      />
      <Card 
        title="Active Referrals" 
        value={stats?.referrals || 0} 
        subtext="Successfully converted" 
      />
      <Card 
        title="Pending Payout" 
        value={`$${((stats?.balance || 0) / 100).toFixed(2)}`} 
        subtext="Available for withdrawal"
        status={(stats?.balance || 0) > 0 ? 'pending' : 'normal'}
      />
    </div>
  );
};
