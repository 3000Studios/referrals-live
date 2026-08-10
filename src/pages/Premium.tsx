import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";
import { trackEvent, trackPremiumView } from "@/lib/analytics";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => void };
    };
  }
}

const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK as string | undefined;
const PAYPAL_CLIENT_ID    = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;
const PAYPAL_PLAN_ID      = import.meta.env.VITE_PAYPAL_PLAN_ID as string | undefined;

const perks = [
  { icon: "✦", text: "Manage your listings from one dashboard" },
  { icon: "★", text: "Request up to two featured homepage placements" },
  { icon: "↗", text: "Use tracked outbound redirects for your published links" },
  { icon: "◎", text: "Submit public listing candidates for review" },
];

function PayPalButton() {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [ppError, setPpError] = useState<string | null>(null);

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_PLAN_ID) return;
    if (window.paypal) { renderButton(); return; }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription&components=buttons`;
    script.setAttribute("data-sdk-integration-source", "button-factory");
    script.onload = () => renderButton();
    script.onerror = () => setPpError("PayPal failed to load. Use card checkout above.");
    document.head.appendChild(script);

    return () => { document.head.removeChild(script); };
  }, []);

  function renderButton() {
    if (!window.paypal || !ref.current || !PAYPAL_PLAN_ID) return;
    try {
      window.paypal.Buttons({
        style: { layout: "vertical", color: "gold", shape: "rect", label: "subscribe" },
        createSubscription: (_data: unknown, actions: any) =>
          actions.subscription.create({ plan_id: PAYPAL_PLAN_ID }),
        onApprove: (_data: any) => {
          trackEvent("premium_click", { plan: "Premium", method: "paypal", status: "approved" });
          window.location.href = "/dashboard?billing=success&provider=paypal";
        },
        onError: () => setPpError("PayPal error. Try card checkout above."),
      }).render(ref.current!);
      setLoaded(true);
    } catch {
      setPpError("PayPal unavailable. Use card checkout above.");
    }
  }

  if (!PAYPAL_CLIENT_ID || !PAYPAL_PLAN_ID) return null;

  return (
    <div className="mt-4">
      {ppError && (
        <p className="mb-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">{ppError}</p>
      )}
      <div ref={ref} className={loaded ? "" : "opacity-60"} />
      {!loaded && !ppError && (
        <div className="flex items-center justify-center rounded-xl bg-[#ffc439] py-3 text-sm font-bold text-[#003087] opacity-60">
          Loading PayPal…
        </div>
      )}
    </div>
  );
}

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
    trackEvent("premium_click", { plan: "Premium", method: "stripe" });

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
        if (r.ok && d?.url) { window.location.href = d.url; return; }
        if (STRIPE_PAYMENT_LINK) { window.location.href = STRIPE_PAYMENT_LINK; return; }
        const reason = d?.error ?? `Checkout server returned ${r.status}`;
        throw new Error(`${reason}. Try PayPal below or contact support@referrals.live.`);
      })
      .catch((err) => {
        if (STRIPE_PAYMENT_LINK) { window.location.href = STRIPE_PAYMENT_LINK; return; }
        setError(err instanceof Error ? err.message : "Unable to start checkout");
        setLoading(false);
      });
  }

  const cardCheckoutAvailable = Boolean(user) || Boolean(STRIPE_PAYMENT_LINK);

  return (
    <div>
      <Seo
        title="Premium — referrals.live"
        description="Upgrade to Premium to manage listings, request featured homepage placement, and use tracked outbound redirects."
        path="/premium"
      />

      {/* Header */}
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Upgrade</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Go Premium</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">For program owners who want a clear, accountable path to additional marketplace visibility. Current pricing and billing terms are confirmed at checkout.</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">

        {/* Left: plan + checkout */}
        <div className="space-y-6">

          {/* Plan card */}
          <div className="glass rounded-3xl border border-white/10 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neon">Listing promotion</div>
                <div className="mt-1 font-display text-2xl font-bold text-white">Premium membership</div>
              </div>
              <div className="max-w-32 text-right text-xs leading-relaxed text-muted">Pricing and renewal terms are shown by the payment provider.</div>
            </div>

            <ul className="mt-6 space-y-3">
              {perks.map((p) => (
                <li key={p.text} className="flex items-start gap-3 text-sm text-muted">
                  <span className="mt-0.5 text-base leading-none">{p.icon}</span>
                  <span>{p.text}</span>
                </li>
              ))}
            </ul>

            {/* Stripe CTA */}
            <div className="mt-8">
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted/60">Credit / Debit Card</div>
              {cardCheckoutAvailable ? (
                <button
                  type="button"
                  onClick={startCardCheckout}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connecting to Stripe…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                      Continue to secure checkout
                    </>
                  )}
                </button>
              ) : (
                <Link
                  to="/login?next=/premium"
                  className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold text-white hover:bg-white/10"
                >
                  Login to upgrade
                </Link>
              )}

              {/* PayPal */}
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted/60">Or pay with PayPal</div>
                <PayPalButton />
              </div>
            </div>

            {error && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-100">
                <div className="font-bold mb-1">Checkout Error</div>
                {error}
              </div>
            )}

            {/* Trust line */}
            <p className="mt-5 rounded-2xl border border-gold/20 bg-gold/10 p-4 text-xs leading-relaxed text-gold/90">Membership availability, pricing, renewal terms, and cancellation options are shown before payment. Featured placement is subject to listing review and availability.</p>

            {/* Payment logos */}
            <div className="mt-6 flex items-center justify-center gap-6 opacity-40 grayscale hover:opacity-80 hover:grayscale-0 transition-all">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="h-4" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5" />
            </div>
          </div>

        </div>

        {/* Right: sidebar */}
        <div className="space-y-5">

          {/* Current status */}
          <div className="glass rounded-3xl border border-white/10 p-5 text-sm text-muted">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Your status</div>
            <div className="mt-2 text-lg font-semibold text-white">
              {user?.premium ? "✅ Premium active" : "⬜ Free tier"}
            </div>
            {!user?.premium && (
              <div className="mt-3 rounded-xl bg-white/5 p-3 text-xs leading-relaxed">
                <span className="text-gold font-semibold">★ Note:</span> Featured placement can increase discovery, but results depend on your offer, audience fit, and current marketplace activity.
              </div>
            )}
          </div>

          {/* Listing guidance */}
          <div className="glass rounded-3xl border border-neon/20 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Before you promote</div>
            <div className="mt-2 font-display text-xl font-bold text-white">Make the offer useful</div>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Use clear eligibility details, an accurate destination URL, and a description that helps visitors decide whether the program fits them.
            </p>
          </div>

          {/* FAQ */}
          <div className="glass rounded-3xl border border-white/10 p-5 space-y-4 text-xs text-muted">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white">FAQ</div>
            {[
              ["What does Premium include?", "Dashboard tools, tracked outbound redirects, public listing-candidate submission, and the ability to request featured placement."],
              ["When does access start?", "Access is updated after the payment provider confirms a successful subscription."],
              ["Is placement guaranteed?", "No. Listings must meet quality and disclosure requirements, and available placement is reviewed before it is shown."],
              ["Can I review price and renewal terms?", "Yes. The payment provider presents current terms before payment is completed."],
            ].map(([q, a]) => (
              <div key={q}>
                <div className="font-semibold text-white/80">{q}</div>
                <div className="mt-0.5 leading-relaxed">{a}</div>
              </div>
            ))}
          </div>

          {/* Support */}
          <div className="glass rounded-3xl border border-white/10 p-5 text-xs text-muted">
            <div className="font-bold text-white mb-1">Need help?</div>
            <a href="mailto:support@referrals.live" className="text-neon hover:underline">support@referrals.live</a>
          </div>
        </div>
      </div>
    </div>
  );
}
