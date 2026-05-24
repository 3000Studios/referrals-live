import { Seo } from "@/components/seo/Seo";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const BADGE_COLORS: Record<string, string> = {
  bronze: "text-orange-400",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  platinum: "text-cyan-300",
  diamond: "text-pink-400",
};

const BADGE_ICONS: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
  diamond: "✨",
};

export function Leaderboard() {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .leaderboard(50, offset)
      .then((res) => setCreators(res.creators))
      .finally(() => setLoading(false));
  }, [offset]);

  return (
    <div>
      <Seo
        title="Leaderboard — referrals.live"
        description="Top creators on referrals.live ranked by clicks, earnings, and impact."
        path="/leaderboard"
      />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Rankings</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Creator Leaderboard</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Ranked by total clicks and earnings. Top performers get featured on the homepage.
      </p>

      <div className="mt-10 space-y-4">
        {loading ? (
          <div className="text-center text-muted">Loading leaderboard...</div>
        ) : creators.length === 0 ? (
          <div className="glass rounded-3xl border border-white/10 p-8 text-center">
            <p className="text-muted">No creators ranked yet. Submit your first referral to get started!</p>
            <Link to="/submit" className="mt-4 inline-block rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-6 py-2 text-sm font-semibold text-black">
              Submit Referral
            </Link>
          </div>
        ) : (
          creators.map((c, idx) => (
            <div key={c.id} className="glass rounded-2xl border border-white/10 p-4 transition hover:border-neon/40">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`text-2xl font-bold ${BADGE_COLORS[c.badge] ?? "text-white"}`}>
                  #{c.rank ?? idx + 1 + offset}
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-neon/30 to-electric/30 flex items-center justify-center text-2xl">
                    {c.avatar ?? "👤"}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{c.displayName}</p>
                    <p className="text-xs text-muted">{c.totalSubmitted} submissions</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="ml-auto grid gap-3 text-right text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted">🔗 {c.totalClicks.toLocaleString()} clicks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gold">${c.totalEarnings.toFixed(2)}</span>
                  </div>
                  {c.avgClicksPerReferral > 0 && (
                    <div className="text-xs text-muted">
                      {c.avgClicksPerReferral.toFixed(1)} avg/referral
                    </div>
                  )}
                </div>

                {/* Badge */}
                <div className="text-2xl">{BADGE_ICONS[c.badge] ?? "⭐"}</div>
              </div>

              {/* Badges earned */}
              {c.badgeCount > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-muted">Achievements: {c.badgeCount}</span>
                </div>
              )}
            </div>
          ))
        )}

        {/* Pagination */}
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => setOffset(Math.max(0, offset - 50))}
            disabled={offset === 0}
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50 hover:border-neon/40"
          >
            Previous
          </button>
          <button
            onClick={() => setOffset(offset + 50)}
            disabled={creators.length < 50}
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm disabled:opacity-50 hover:border-neon/40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
