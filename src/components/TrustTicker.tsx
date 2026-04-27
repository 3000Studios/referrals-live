import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const TrustTicker = () => {
  const [payouts, setPayouts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const response = await fetch('/api/payouts');
        const contentType = response.headers.get('content-type');
        if (response.ok && contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setPayouts(data);
        } else {
          console.warn('API returned non-JSON response or failed. Ticker will stay hidden.');
        }
      } catch (error) {
        console.error('Failed to fetch payouts:', error);
      }
    };

    fetchPayouts();
    const interval = setInterval(fetchPayouts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (payouts.length === 0) return null;

  return (
    <div className="w-full bg-black border-y border-white/10 overflow-hidden py-3">
      <div className="max-w-7xl mx-auto flex items-center">
        <div className="px-4 py-1 bg-neon/10 border border-neon/30 text-neon text-[10px] uppercase tracking-widest font-bold whitespace-nowrap rounded-r-lg z-10 shadow-[0_0_15px_rgba(0,255,136,0.2)]">
          Live Payouts
        </div>
        <div className="relative flex-1 overflow-hidden ml-4">
          <motion.div 
            className="flex whitespace-nowrap"
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          >
            {[...payouts, ...payouts].map((p, i) => (
              <span key={`${p.user_obfuscated_id}-${i}`} className="inline-flex items-center text-xs font-mono uppercase tracking-wider text-slate-300 mx-8">
                <span className="text-green-400 font-bold mr-2">Recent Payout:</span>
                ${(p.amount_cents / 100).toFixed(2)} to {p.user_obfuscated_id} via Stripe
                <span className="ml-8 text-white/20">•</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
