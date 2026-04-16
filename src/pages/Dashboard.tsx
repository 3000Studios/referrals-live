import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { badgeLabels, useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";

export function Dashboard() {
  const user = useAppStore((s) => s.user);
  const referrals = useAppStore((s) => s.referrals);
  const boost = useAppStore((s) => s.boostReferral);

  const mine = useMemo(() => referrals.filter((r) => user && r.authorId === user.id), [referrals, user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <Seo title="Dashboard — referrals.live" description="Manage your referral submissions." path="/dashboard" />
        <h1 className="font-display text-3xl font-bold text-white">Sign in required</h1>
        <p className="mt-3 text-sm text-muted">Login to view your dashboard.</p>
        <Link className="mt-6 inline-flex rounded-2xl bg-neon px-6 py-3 text-sm font-semibold text-black" to="/login">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Seo title="Dashboard — referrals.live" description="Your submissions, stats, ranks, and badges." path="/dashboard" />
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Operator desk</div>
          <h1 className="font-display text-4xl font-extrabold text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-muted">
            Premium: <span className="text-white">{user.premium ? "active" : "not active"}</span>
          </p>
        </div>
        <Link
          to="/premium"
          className="rounded-2xl border border-gold/40 px-5 py-3 text-sm font-semibold text-gold hover:bg-gold/10"
        >
          Upgrade
        </Link>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs uppercase tracking-wide text-muted">Points</div>
          <div className="mt-2 font-display text-4xl font-extrabold text-neon">{user.points}</div>
          <p className="mt-2 text-xs text-muted">Earn via submissions, votes, and clicks (demo economy).</p>
        </div>
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs uppercase tracking-wide text-muted">Rank</div>
          <div className="mt-2 font-display text-4xl font-extrabold text-electric">#{user.rank}</div>
          <p className="mt-2 text-xs text-muted">Leaderboard rank is illustrative until backend sync exists.</p>
        </div>
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs uppercase tracking-wide text-muted">Badges</div>
          <ul className="mt-3 space-y-2 text-sm text-white">
            {user.badges.map((b) => (
              <li key={b} className="rounded-2xl bg-white/5 px-3 py-2">
                {b}
              </li>
            ))}
            {!user.badges.length ? <li className="text-muted">Earn {badgeLabels.EARLY_USER} by staying active.</li> : null}
          </ul>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-white">Your submissions</h2>
          <Link to="/submit" className="text-sm font-semibold text-electric hover:text-white">
            New submission →
          </Link>
        </div>
        <div className="grid gap-4">
          {mine.length ? (
            mine.map((r) => (
              <div key={r.id} className="glass flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 p-4">
                <div>
                  <div className="font-semibold text-white">{r.title}</div>
                  <div className="text-xs text-muted">
                    {r.votes} votes · {r.clicks} clicks · {r.boosted ? "boosted" : "standard"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => boost(r.id)}
                  className="rounded-2xl border border-neon/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neon hover:bg-neon/10"
                >
                  Boost (demo)
                </button>
              </div>
            ))
          ) : (
            <div className="glass rounded-3xl border border-white/10 p-6 text-sm text-muted">
              No submissions yet.{" "}
              <Link className="text-electric hover:text-white" to="/submit">
                Submit your first referral
              </Link>
              .
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 glass rounded-3xl border border-white/10 p-6 text-sm text-muted">
        <div className="font-display text-lg font-bold text-white">Stats (placeholder-ready)</div>
        <p className="mt-2">
          Wire these cards to your analytics backend: outbound CTR, redemption rate proxies, and cohort retention by category.
        </p>
      </div>
    </div>
  );
}
