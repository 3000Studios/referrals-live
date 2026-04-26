import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";
import { ReferralCard } from "@/components/referrals/ReferralCard";
import { sortByPopular } from "@/lib/trending";

export function Leaderboard() {
  const referrals = useAppStore((s) => s.referrals);
  const topLinks = sortByPopular(referrals).slice(0, 6);

  return (
    <div>
      <Seo
        title="Leaderboards — referrals.live"
        description="Top community operators and highest-signal referral links, updated from live marketplace activity."
        path="/leaderboard"
      />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Gamification</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Leaderboards</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Points reward submissions, votes, and engagement. Badges highlight early power users and viral listings.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Top users</div>
          <p className="mt-4 text-sm text-muted">
            Our most active community members: rankings are determined by a composite score of total clicks generated and successful upvotes received.
          </p>
        </div>
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Top links</div>
          <div className="mt-4 space-y-4 text-sm text-muted">
            {topLinks.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-3 py-2">
                <div className="text-white">{r.title}</div>
                <div className="text-right text-xs">
                  <div className="text-neon">{r.votes} votes</div>
                  <div>{r.clicks} clicks</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="mb-6 text-sm font-semibold text-white">Featured high-performers</div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {topLinks.map((r, i) => (
            <ReferralCard key={r.id} referral={r} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
