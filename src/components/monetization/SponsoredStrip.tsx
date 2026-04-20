import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

export function SponsoredStrip() {
  const referrals = useAppStore((s) => s.referrals);
  const featured = useMemo(() => referrals.slice(0, 3), [referrals]);
  if (!featured.length) return null;
  return (
    <section className="glass rounded-3xl border border-gold/25 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Featured placements</div>
          <p className="mt-1 text-sm text-muted">Top programs trending with our audience right now.</p>
        </div>
        <Link
          to="/contact"
          className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gold hover:bg-gold/10"
        >
          Book a slot
        </Link>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {featured.map((r) => (
          <a
            key={r.id}
            href={`/go/${r.id}`}
            target="_blank"
            rel="noreferrer"
            className="group rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-neon/40"
          >
            <div className="text-sm font-semibold text-white group-hover:text-neon">{r.title}</div>
            <div className="mt-2 line-clamp-2 text-xs text-muted">{r.description}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
