import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const TrustTicker = () => {
  const [payouts, setPayouts] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    fetch('/api/payouts')
      .then((r) => {
        const ct = r.headers.get('content-type');
        if (r.ok && ct?.includes('application/json')) return r.json();
        return null;
      })
      .then((data) => {
        if (!alive || !Array.isArray(data)) return;
        setPayouts(data);
      })
      .catch(() => null);

    const id = setInterval(() => {
      fetch('/api/payouts')
        .then((r) => r.json())
        .then((d) => { if (alive && Array.isArray(d)) setPayouts(d); })
        .catch(() => null);
    }, 60_000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!payouts.length) return null;

  return (
    <div className="relative w-full border-b border-white/5 bg-black/70 backdrop-blur-sm overflow-hidden py-2.5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_100%_at_0%_50%,rgba(0,255,136,0.05),transparent)]" />
      <div className="max-w-7xl mx-auto flex items-center gap-0">
        {/* Label */}
        <div className="shrink-0 flex items-center gap-1.5 border-r border-white/8 bg-neon/8 px-4 py-1 text-[10px] uppercase tracking-[0.22em]">
          <span className="h-1.5 w-1.5 rounded-full bg-neon shadow-[0_0_6px_rgba(0,255,136,0.8)] animate-pulse" />
          <span className="font-bold text-neon whitespace-nowrap">Live Payouts</span>
        </div>
        {/* Scrolling payouts */}
        <div className="relative flex-1 overflow-hidden px-4">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{ x: [0, -1100] }}
            transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
          >
            {[...payouts, ...payouts].map((p, i) => (
              <span
                key={`${p.user_obfuscated_id}-${i}`}
                className="inline-flex items-center text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 mx-6"
              >
                <span className="text-neon/70 font-bold mr-1.5">+${(p.amount_cents / 100).toFixed(2)}</span>
                to {p.user_obfuscated_id}
                <span className="ml-6 text-white/15">◆</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
