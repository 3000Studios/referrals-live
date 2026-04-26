import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, ApiReferral } from "@/lib/api";
import { ReferralCard } from "../referrals/ReferralCard";

export function DiscoveryScanner() {
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("all");
  const [results, setResults] = useState<ApiReferral[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await api.scanDiscovery(filter);
      // Map discovered items to ApiReferral format
      const mapped = res.results.map((r: any) => ({
        id: r.id || `scanned-${Math.random()}`,
        title: r.title,
        description: r.description,
        url: r.url,
        category: r.category,
        tags: r.tags || [],
        image: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=800&q=80",
        votes: 0,
        clicks: 0,
        createdAt: Date.now(),
        source: "discovery"
      }));
      setResults(mapped);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 p-8 shadow-2xl">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-neon/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-electric/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-neon mb-2">Discovery Engine v2.0</div>
        <h2 className="font-display text-4xl font-bold text-white mb-4">Deep Web Referral Scanner</h2>
        <p className="max-w-2xl mx-auto text-muted mb-8">
          Toggle the AI crawler to scan the internet for the latest and highest-paying referral programs. 
          Automated extraction of sign-up requirements and reward payouts.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-2xl border border-white/10 bg-black/60 px-6 py-3 text-sm text-white outline-none ring-neon/30 focus:ring"
          >
            <option value="all">All Referrals</option>
            <option value="cash">Cash Payouts</option>
            <option value="points">Points & Credits</option>
            <option value="crypto">Crypto Rewards</option>
            <option value="saas">SaaS Discounts</option>
          </select>

          <button
            onClick={handleScan}
            disabled={scanning}
            className="group relative inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-8 py-4 text-sm font-bold text-black shadow-neon transition hover:scale-[1.02] disabled:opacity-50"
          >
            {scanning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full"
                />
                Crawling...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Scan & Discover
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
            {error}
          </div>
        )}

        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 flex flex-col items-center"
            >
              <div className="relative h-32 w-32 mb-6">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-neon/20 rounded-full blur-xl"
                />
                <div className="absolute inset-0 border-4 border-neon/20 rounded-full" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="absolute inset-0 border-t-4 border-neon rounded-full"
                />
              </div>
              <div className="font-mono text-xs text-neon animate-pulse uppercase tracking-widest">
                Scanning deep sources... Extracting reward metadata...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {results.length > 0 && !scanning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 text-left"
          >
            {results.map((r, i) => (
              <ReferralCard key={r.id} referral={r} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
