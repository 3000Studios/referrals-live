import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

export function SponsoredStrip() {
  const referrals = useAppStore((s) => s.referrals);
  const featured = useMemo(() => referrals.slice(0, 3), [referrals]);
  if (!featured.length) return null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gold/15 bg-gradient-to-br from-[rgba(255,215,0,0.03)] via-[rgba(3,4,9,0.9)] to-[rgba(255,140,0,0.02)] p-px">
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/4" />
      <div className="relative rounded-3xl bg-[rgba(3,4,9,0.85)] backdrop-blur-xl p-6">
        <div className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-gold/4 blur-3xl" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-gold animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-gold/70">Featured placements</span>
            </div>
            <p className="text-[13px] text-muted">Top programs trending with our audience right now.</p>
          </div>
          <Link
            to="/contact"
            className="rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold/80 transition hover:border-gold/60 hover:bg-gold/10 hover:text-gold"
          >
            Book a slot
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {featured.map((r) => (
            <a
              key={r.id}
              href={`/go/${r.id}`}
              target="_blank"
              rel="noreferrer"
              className="group relative overflow-hidden rounded-2xl border border-white/6 bg-white/[0.025] p-4 transition-all duration-300 hover:border-gold/30 hover:bg-white/[0.04] hover:[box-shadow:0_0_20px_rgba(255,215,0,0.08)]"
            >
              <div className="text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors leading-snug">
                {r.title}
              </div>
              <div className="mt-1.5 line-clamp-2 text-[11px] text-muted leading-relaxed">
                {r.description}
              </div>
              <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gold/50 group-hover:text-gold/80 transition-colors">
                View offer →
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
