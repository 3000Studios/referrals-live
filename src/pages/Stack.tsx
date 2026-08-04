import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Seo } from "@/components/seo/Seo";
import { ReferralCard } from "@/components/referrals/ReferralCard";
import { useAppStore } from "@/store/useAppStore";
import { useReferralStack } from "@/store/useReferralStack";

const goalNames = {
  "first-referral": "Start simple",
  creator: "Grow an audience",
  cashback: "Save money",
  business: "Run a business",
};

export function Stack() {
  const referrals = useAppStore((s) => s.referrals);
  const savedIds = useReferralStack((s) => s.savedIds);
  const goal = useReferralStack((s) => s.goal);
  const clear = useReferralStack((s) => s.clear);
  const hydrate = useReferralStack((s) => s.hydrate);
  const saved = referrals.filter((referral) => savedIds.includes(referral.id));

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div>
      <Seo title="Your referral stack — referrals.live" description="Compare and act on the referral programs you saved." path="/stack" />
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Your shortlist</div>
          <h1 className="mt-2 font-display text-4xl font-extrabold text-white">Referral stack</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Save programs while you research, then open each provider page to confirm the current terms, eligibility, and reward details before sharing.
          </p>
          {goal ? <div className="mt-4 inline-flex rounded-full border border-neon/25 bg-neon/10 px-3 py-1.5 text-xs font-semibold text-neon">Goal: {goalNames[goal]}</div> : null}
        </div>
        <aside className="glass rounded-3xl border border-white/10 p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">A good next move</div>
          <ol className="mt-4 space-y-3 text-sm text-muted">
            <li><span className="mr-2 font-semibold text-white">1.</span>Open the provider terms and check eligibility.</li>
            <li><span className="mr-2 font-semibold text-white">2.</span>Try one program you would genuinely recommend.</li>
            <li><span className="mr-2 font-semibold text-white">3.</span>Track your own results before adding more.</li>
          </ol>
        </aside>
      </section>

      {saved.length ? (
        <>
          <div className="mt-8 flex items-center justify-between gap-4">
            <div className="text-sm text-muted">{saved.length} saved {saved.length === 1 ? "program" : "programs"}</div>
            <button type="button" onClick={clear} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-red-400/50 hover:text-red-200">Clear stack</button>
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {saved.map((referral, index) => <ReferralCard key={referral.id} referral={referral} index={index} />)}
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-neon/25 bg-neon/[0.03] p-8 text-center">
          <h2 className="font-display text-2xl font-bold text-white">Nothing saved yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted">Start with a goal, then use “Save to stack” on programs worth comparing. Your stack stays in this browser.</p>
          <Link to="/browse" className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-5 py-3 text-sm font-semibold text-black shadow-neon">Browse programs</Link>
        </div>
      )}
    </div>
  );
}
