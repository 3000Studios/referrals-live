import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";
import { trackEvent, trackPremiumView } from "@/lib/analytics";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const plan = {
  name: "Premium",
  price: "$7.99 / month",
  perks: [
    "Post and manage referrals in your dashboard",
    "Unlock live chat posting (read-only stays free)",
    "Choose 2 featured links on the homepage",
    "Tracked outbound redirects for performance stats",
    "Priority consideration for public listings",
  ],
};

// Static payment fallbacks — set these in Cloudflare Pages env so checkout works
// even before the backend Stripe API keys/webhook are configured.
const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK as string | undefined;
const PAYPAL_LINK = import.meta.env.VITE_PAYPAL_LINK as string | undefined;

export function Premium() {
  const user = useAppStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackPremiumView("premium_page");
  }, []);

  function startCardCheckout() {
    setLoading(true);
    setError(null);
    trackEvent("premium_click", { plan: plan.name, method: "stripe" });

    if (!user) {
      if (STRIPE_PAYMENT_LINK) {
        window.location.href = STRIPE_PAYMENT_LINK;
        return;
      }
      window.location.href = "/login?next=/premium";
      return;
    }

    fetch("/api/billing/checkout", { method: "POST", credentials: "include" })
      .then(async (r) => {
        const d = await r.json().catch(() => null) as { url?: string; error?: string } | null;
        if (r.ok && d?.url) {
          window.location.href = d.url;
          return;
        }
        if (STRIPE_PAYMENT_LINK) {
          window.location.href = STRIPE_PAYMENT_LINK;
          return;
        }
        const reason = d?.error ?? `Checkout server returned ${r.status}`;
        throw new Error(
          PAYPAL_LINK
            ? `${reason}. Try PayPal below, or contact support.`
            : `${reason}. Please email support@referrals.live so we can complete your upgrade.`,
        );
      })
      .catch((err) => {
        if (STRIPE_PAYMENT_LINK) {
          window.location.href = STRIPE_PAYMENT_LINK;
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to start checkout");
        setLoading(false);
      });
  }

  const cardCheckoutAvailable = Boolean(user) || Boolean(STRIPE_PAYMENT_LINK);

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
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 transition-all hover:-translate-y-1 hover:border-electric/50 hover:bg-white/[0.04] lg:col-span-2">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-electric/10 blur-3xl transition-all group-hover:bg-electric/20" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-electric/10 text-3xl">💳</div>
              <h3 className="mt-6 font-display text-xl font-bold text-white">Credit / Debit Card</h3>
              <p className="mt-2 text-sm text-muted">Securely pay with Visa, Mastercard, or AMEX. Instant activation.</p>
              
              <ul className="mt-6 space-y-2 text-xs text-muted/80">
                <li className="flex items-center gap-2">✓ Powered by Stripe</li>
                <li className="flex items-center gap-2">✓ No account required</li>
                <li className="flex items-center gap-2">✓ Encrypted & Secure</li>
              </ul>

              {cardCheckoutAvailable ? (
                <button
                  type="button"
                  onClick={startCardCheckout}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-black transition-transform active:scale-95 disabled:opacity-40"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      Connecting...
                    </span>
                  ) : "Pay with Card"}
                </button>
              ) : (
                <Link to="/login?next=/premium" className="mt-8 block w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-bold text-white hover:bg-white/10">
                  Login to upgrade
                </Link>
              )}

              {PAYPAL_LINK ? (
                <a
                  href={PAYPAL_LINK}
                  onClick={() => trackEvent("premium_click", { plan: plan.name, method: "paypal" })}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ffc439] px-6 py-4 text-sm font-bold text-[#003087] transition-transform active:scale-95"
                >
                  Pay with PayPal
                </a>
              ) : null}
              <p className="mt-5 rounded-2xl border border-gold/20 bg-gold/10 p-4 text-xs leading-relaxed text-gold/90">
                Pro is a recurring subscription. Access starts after Stripe confirms payment. All sales are final and non-refundable except where required by law.
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-8 animate-in fade-in slide-in-from-top-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm text-red-100">
              <div className="font-bold mb-1">Checkout Error</div>
              {error}
            </div>
          ) : null}
          
          <div className="mt-10 flex items-center justify-center gap-6 opacity-40 grayscale transition-all hover:opacity-80 hover:grayscale-0">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-3xl border border-white/10 p-6 text-sm text-muted">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Current status</div>
            <div className="mt-3 text-lg font-semibold text-white">
              {user?.premium ? "Premium active" : "Free tier"}
            </div>
            <p className="mt-3 leading-relaxed">
              Premium unlocks homepage featuring and live chat posting. Your featured links can be changed anytime.
            </p>
            {!user?.premium ? (
              <div className="mt-4 rounded-2xl bg-white/5 p-4 text-xs">
                <span className="text-gold">★ Tip:</span> Premium members get 3x more clicks on average due to featured placement.
              </div>
            ) : null}
          </div>

          <div className="glass rounded-3xl border border-neon/10 p-6 text-xs text-muted">
            <div className="font-bold text-white mb-2">Need assistance?</div>
            Contact <a href="mailto:mr.jwswain@gmail.com" className="text-neon hover:underline">support@referrals.live</a> for billing inquiries.
          </div>
        </div>
      </div>



    </div>
  );
}
