import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";
import { trackEvent, trackPremiumView } from "@/lib/analytics";
import { useEffect } from "react";

const plan = {
  name: "Premium",
  price: "$7.99 / 30 days",
  perks: [
    "Post and manage referrals in your dashboard",
    "Unlock live chat posting (read-only stays free)",
    "Choose 2 featured links on the homepage",
    "Tracked outbound redirects for performance stats",
    "Priority consideration for public listings",
  ],
};

export function Premium() {
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    trackPremiumView("premium_page");
  }, []);

  return (
    <div>
      <Seo
        title="Premium — referrals.live"
        description="Upgrade to Premium for homepage featuring, live chat posting, and priority placement."
        path="/premium"
      />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Monetization</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Premium</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        One plan. One price. Everything Premium offers is included.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neon">Single plan</div>
          <div className="mt-3 font-display text-3xl font-bold text-white">{plan.name}</div>
          <div className="mt-2 text-4xl font-extrabold text-gold">{plan.price}</div>
          <ul className="mt-6 space-y-3 text-sm text-muted">
            {plan.perks.map((x) => (
              <li key={x} className="flex gap-2">
                <span className="text-neon">✓</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              trackEvent("premium_click", { plan: plan.name });
              fetch("/api/billing/checkout", { method: "POST", credentials: "include" })
                .then((r) => r.json())
                .then((d) => {
                  if (d?.url) window.location.href = d.url;
                })
                .catch(() => null);
            }}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-neon to-emerald-400 px-4 py-3 text-sm font-semibold text-black shadow-neon disabled:opacity-40"
            disabled={!user}
          >
            {user ? "Upgrade to Premium" : "Login to upgrade"}
          </button>
        </div>

        <div className="glass rounded-3xl border border-white/10 p-6 text-sm text-muted">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Current status</div>
          <div className="mt-3 text-lg font-semibold text-white">
            {user?.premium ? "Premium active" : "Free tier"}
          </div>
          <p className="mt-3">
            Premium unlocks homepage featuring and live chat posting. Your featured links can be changed anytime.
          </p>
          {!user?.premium ? (
            <p className="mt-3">
              Not ready yet? You can still browse, upvote, and read the live chat for free.
            </p>
          ) : null}
        </div>
      </div>

    </div>
  );
}
