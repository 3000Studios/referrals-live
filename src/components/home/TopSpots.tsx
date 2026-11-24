import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, type TopSpot } from "@/lib/api";
import { categories } from "@/data/categories";
import { TiltCard } from "@/components/effects/TiltCard";
import { trackOutboundClick } from "@/lib/analytics";

/**
 * Paid Top Spots. Premium members pin up to two of their own live listings;
 * each shows here while their subscription is active. These are paid
 * placements, so the section is labeled Sponsored.
 */
export function TopSpots({ compact = false }: { compact?: boolean }) {
  const [spots, setSpots] = useState<TopSpot[] | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .topSpots()
      .then((r) => alive && setSpots(r.spots ?? []))
      .catch(() => alive && setSpots([]));
    return () => {
      alive = false;
    };
  }, []);

  if (spots === null || (compact && spots.length === 0)) return null;
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  return (
    <section className={compact ? "mt-8" : "mt-12"} aria-label="Sponsored Top Spots">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="fx-sponsored inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold">Sponsored · Top Spots</span>
          </div>
          {!compact ? (
            <>
              <h2 className="mt-3 font-display text-3xl font-bold text-white">Pinned by Premium members</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted">
                Paid placements. Each Premium member can pin two of their own live links here.
              </p>
            </>
          ) : null}
        </div>
        <Link
          to={spots.length ? "/dashboard" : "/premium"}
          className="rounded-2xl border border-gold/40 px-5 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/10"
        >
          Get a Top Spot
        </Link>
      </div>

      {spots.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {spots.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <TiltCard tone="gold" className="group glass h-full border border-gold/20">
                <div className="flex h-full flex-col p-5">
                  <div className="flex items-center gap-3">
                    {s.image ? (
                      <img src={s.image} alt="" className="h-11 w-11 rounded-xl bg-white/95 object-contain p-1" loading="lazy" decoding="async" />
                    ) : null}
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-white">{s.title}</h3>
                      <div className="text-[11px] uppercase tracking-wide text-muted">{catName(s.category)}</div>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-3 flex-1 text-xs leading-relaxed text-white/70">{s.description}</p>
                  <div className="mt-3 text-[11px] text-white/50">Posted by {s.poster}</div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted">
                      {s.clicks} clicks · {s.votes} votes
                    </span>
                    <a
                      href={`/offer/${s.id}`}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      onClick={() => trackOutboundClick(s.id, `/offer/${s.id}`)}
                      className="rounded-xl bg-gradient-to-r from-gold to-amber-500 px-4 py-2 text-xs font-bold text-black transition hover:brightness-110 active:scale-95"
                    >
                      Get offer →
                    </a>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      ) : !compact ? (
        <TiltCard tone="gold" className="group glass mt-6 border border-dashed border-gold/25">
          <div className="p-6 text-center">
            <p className="text-sm text-white/80">
              No Top Spots are booked right now. Premium members can pin their own links here from the dashboard.
            </p>
            <Link
              to="/premium"
              className="mt-3 inline-block rounded-2xl bg-gradient-to-r from-gold to-amber-500 px-6 py-3 text-sm font-bold text-black shadow-gold transition hover:brightness-110"
            >
              Go Premium, $3.99/mo
            </Link>
          </div>
        </TiltCard>
      ) : null}
    </section>
  );
}
