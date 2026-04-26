import { useState, useEffect } from 'react';
import { Seo } from '@/components/seo/Seo';
import { StatsGrid } from '@/components/referrals/StatsGrid';
import { ReferralLinkCard } from '@/components/referrals/ReferralLinkCard';
import { TransactionTable } from '@/components/referrals/TransactionTable';

export function AffiliateConsole() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch affiliate data from D1 via our new worker
    const fetchAffiliateData = async () => {
      try {
        const response = await fetch('/api/affiliate');
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load affiliate data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAffiliateData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Seo 
        title="Affiliate Console — 3000Studios" 
        description="Track your referral revenue and performance." 
        path="/affiliate"
      />
      
      <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">
            Partner Network
          </span>
          <h1 className="text-4xl font-extrabold text-white mt-2">
            referrals.live <span className="text-neon">Affiliates</span>
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats and Transactions */}
        <div className="lg:col-span-2 space-y-8">
          <StatsGrid stats={data?.stats} />
          
          <div className="glass rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Recent Payouts</h2>
              <span className="rounded-full bg-neon/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neon">Verified</span>
            </div>
            <TransactionTable data={data?.transactions || []} />
          </div>
        </div>

        {/* Right Column: Link and Promotion */}
        <div className="space-y-8">
          <ReferralLinkCard code={data?.referralCode || 'OPERATOR'} />
          
          <div className="p-6 rounded-2xl border border-neon/20 bg-neon/5">
            <h4 className="text-sm font-bold text-white mb-2">Viral Growth Hacks</h4>
            <ul className="text-xs text-slate-400 space-y-3 list-disc pl-4">
              <li>Add your Operator Board to your <span className="text-white">X Bio</span> for passive clicks.</li>
              <li>Share your high-earning links in <span className="text-white">Subreddits</span> like r/SideHustle.</li>
              <li>Record a 60s <span className="text-white">TikTok/Reel</span> showing your board and link it.</li>
              <li>Mention @referralslive on X to get a retweet to our 50k+ followers.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
