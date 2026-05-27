import { Seo } from "@/components/seo/Seo";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { useEffect, useState } from "react";

export function Analytics() {
  const user = useAppStore((s) => s.user);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api
      .myAnalytics()
      .then((res) => setAnalytics(res))
      .catch((e) => console.error("Analytics error:", e))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return <div className="text-center text-muted">Please log in to view analytics</div>;
  }

  if (loading) {
    return <div className="text-center text-muted">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center text-muted">No analytics data available</div>;
  }

  const { leaderboard, referrals, badges, earnedRewards, earningsHistory } = analytics;

  return (
    <div>
      <Seo
        title="Analytics — referrals.live"
        description="Your referral earnings, click data, and performance metrics."
        path="/analytics"
      />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Dashboard</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Your Analytics</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Real-time tracking of your clicks, earnings, and leaderboard rank.
      </p>

      {/* Top Stats */}
      <div className="mt-10 grid gap-4 md:grid-cols-4">
        <div className="glass rounded-2xl border border-white/10 p-4">
          <div className="text-xs text-muted">Rank</div>
          <div className="mt-2 text-3xl font-bold text-neon">#{leaderboard.rank ?? "—"}</div>
          <div className="mt-1 text-xs text-muted">{leaderboard.badge} tier</div>
        </div>
        <div className="glass rounded-2xl border border-white/10 p-4">
          <div className="text-xs text-muted">Total Clicks</div>
          <div className="mt-2 text-3xl font-bold text-electric">{leaderboard.totalClicks.toLocaleString()}</div>
          <div className="mt-1 text-xs text-muted">all time</div>
        </div>
        <div className="glass rounded-2xl border border-white/10 p-4">
          <div className="text-xs text-muted">Total Earnings</div>
          <div className="mt-2 text-3xl font-bold text-gold">${leaderboard.totalEarnings.toFixed(2)}</div>
          <div className="mt-1 text-xs text-muted">all time</div>
        </div>
        <div className="glass rounded-2xl border border-white/10 p-4">
          <div className="text-xs text-muted">Avg / Referral</div>
          <div className="mt-2 text-3xl font-bold text-neon">{leaderboard.avgClicksPerReferral.toFixed(1)}</div>
          <div className="mt-1 text-xs text-muted">clicks</div>
        </div>
      </div>

      {/* Referral Performance */}
      <div className="mt-10">
        <div className="mb-4 text-lg font-semibold text-white">Your Referrals</div>
        <div className="space-y-3">
          {referrals.length === 0 ? (
            <div className="glass rounded-2xl border border-white/10 p-4 text-center text-muted">
              No referrals yet. Submit your first one to start earning!
            </div>
          ) : (
            referrals.map((r: any) => (
              <div key={r.id} className="glass rounded-2xl border border-white/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{r.title}</h3>
                    <p className="mt-1 text-xs text-muted">{r.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-electric">{r.clicksMonth}</div>
                    <div className="text-xs text-muted">clicks this month</div>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 grid-cols-3 text-xs">
                  <div>
                    <span className="text-muted">Today:</span> <span className="text-white">{r.clicksToday}</span>
                  </div>
                  <div>
                    <span className="text-muted">This Week:</span> <span className="text-white">{r.clicksWeek}</span>
                  </div>
                  <div>
                    <span className="text-gold font-semibold">${r.earningsMonth.toFixed(2)}</span> <span className="text-muted">month</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Earned Rewards */}
      {earnedRewards.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 text-lg font-semibold text-white">Earned Rewards</div>
          <div className="space-y-3">
            {earnedRewards.map((r: any) => (
              <div key={r.id} className="glass rounded-2xl border border-neon/30 bg-neon/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{r.reason.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted">{new Date(r.earnedAt * 1000).toLocaleDateString()}</p>
                  </div>
                  <div className="text-2xl font-bold text-gold">+${r.bonus.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 text-lg font-semibold text-white">Your Achievements</div>
          <div className="flex flex-wrap gap-3">
            {badges.map((b: any) => (
              <div key={b.type} className="rounded-full bg-gradient-to-r from-neon/20 to-electric/20 border border-neon/30 px-4 py-2 text-sm font-semibold text-neon">
                ✓ {b.type.replace(/_/g, " ")}
              </div>
            ))}
          </div>
        </div>
      )}

      {earningsHistory.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div className="text-lg font-semibold text-white">Earnings History (Last 30 Days)</div>
            <div className="text-xs text-muted">
              Total: <span className="text-gold font-semibold">
                ${earningsHistory.reduce((s: number, h: any) => s + (h.earnings ?? 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="glass rounded-2xl border border-white/10 p-6">
            <EarningsChart points={[...earningsHistory].reverse()} />
          </div>
        </div>
      )}
    </div>
  );
}

function EarningsChart({ points }: { points: Array<{ date: string; clicks: number; earnings: number }> }) {
  const width = 720;
  const height = 220;
  const padX = 36;
  const padY = 18;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const maxEarnings = Math.max(0.01, ...points.map((p) => p.earnings));
  const barW = innerW / points.length;
  const gap = Math.max(1, barW * 0.18);

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => (maxEarnings * (yTicks - i)) / yTicks);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64" role="img" aria-label="Daily earnings, last 30 days">
        {tickVals.map((v, i) => {
          const y = padY + (innerH * i) / yTicks;
          return (
            <g key={i}>
              <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
              <text x={padX - 6} y={y + 3} textAnchor="end" fontSize={10} fill="rgba(255,255,255,0.45)">
                ${v.toFixed(v >= 10 ? 0 : 2)}
              </text>
            </g>
          );
        })}

        {points.map((p, i) => {
          const h = (p.earnings / maxEarnings) * innerH;
          const x = padX + i * barW + gap / 2;
          const y = padY + innerH - h;
          const showLabel = points.length <= 30 && (i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 6) === 0);
          const dateLabel = (() => {
            const d = new Date(p.date);
            if (Number.isNaN(d.getTime())) return p.date;
            return `${d.getMonth() + 1}/${d.getDate()}`;
          })();
          return (
            <g key={p.date + i}>
              <rect
                x={x}
                y={y}
                width={Math.max(1, barW - gap)}
                height={Math.max(0, h)}
                fill="url(#earningsGrad)"
                rx={2}
              >
                <title>{`${p.date}: $${p.earnings.toFixed(2)} · ${p.clicks} clicks`}</title>
              </rect>
              {showLabel && (
                <text x={x + (barW - gap) / 2} y={height - 4} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.45)">
                  {dateLabel}
                </text>
              )}
            </g>
          );
        })}

        <defs>
          <linearGradient id="earningsGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#facc15" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.55" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
