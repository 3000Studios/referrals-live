import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";
import { trackEvent, trackPremiumView } from "@/lib/analytics";
import { useEffect } from "react";

const plans = [
  {
    name: "Operator",
    price: "$19/mo",
    perks: ["Boost credits monthly", "Higher listing weight", "Badge: Top Referrer unlock path"],
  },
  {
    name: "Publisher",
    price: "$49/mo",
    perks: ["Sponsored rotation eligibility", "Affiliate blocks priority", "Email capture exports (CSV-ready UI)"],
    featured: true,
  },
  {
    name: "Network",
    price: "Custom",
    perks: ["White-label blocks", "API webhooks (frontend flags)", "Dedicated placement calendar"],
  },
];

export function Premium() {
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    trackPremiumView("premium_page");
  }, []);

  return (
    <div>
      <Seo
        title="Premium & boosts — referrals.live"
        description="Upgrade for boosts, sponsored eligibility, and premium marketplace features."
        path="/premium"
      />
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Monetization</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Premium & boosts</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Frontend feature flags are wired via Zustand. Connect billing (Stripe/Lemon) when you go live.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`glass rounded-3xl border p-6 ${p.featured ? "border-neon/50 shadow-neon" : "border-white/10"}`}
          >
            {p.featured ? (
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neon">Most popular</div>
            ) : (
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted"> </div>
            )}
            <div className="mt-3 font-display text-2xl font-bold text-white">{p.name}</div>
            <div className="mt-2 text-3xl font-extrabold text-gold">{p.price}</div>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              {p.perks.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="text-neon">✓</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                trackEvent("premium_click", { plan: p.name });
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
              {user ? "Activate (demo)" : "Login to activate"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 glass rounded-3xl border border-white/10 p-6 text-sm text-muted">
        Current status:{" "}
        <span className="font-semibold text-white">{user?.premium ? "Premium active" : "Free tier"}</span>. This UI is
        production-ready; connect your payment provider to charge real subscriptions.
      </div>
    </div>
  );
}
