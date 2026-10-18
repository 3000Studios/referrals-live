import { Seo } from "@/components/seo/Seo";
import { useAppStore } from "@/store/useAppStore";
import { trackEvent, trackPremiumView } from "@/lib/analytics";
import { useEffect, useState, useRef, FormEvent } from "react";
import { Link } from "react-router-dom";
import { STRIPE_PRO_LINK, PRO_PRICE_LABEL } from "@/data/featured";

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => void };
    };
  }
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;
const PAYPAL_PLAN_ID = import.meta.env.VITE_PAYPAL_PLAN_ID as string | undefined;

// REBUILD 2026-10-18: this page previously carried invented testimonials,
// invented member stats, a randomized fake "spots left" counter and an
// unverified "$10 per referral" claim. All removed — Pro sells on what it
// actually does: posting + featured placement.
const perks = [
  { icon: "🔥", text: "Post your own referral links publicly in the catalog" },
  { icon: "⭐", text: "Pin 2 featured placements on the homepage" },
  { icon: "💬", text: "Post in the live community chat (free tier is read-only)" },
  { icon: "📊", text: "Tracked redirects with click stats for your links" },
  { icon: "🏆", text: "Priority ranking on public listings" },
  { icon: "🤝", text: "Affiliate commissions on members you bring in" },
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
          trackEvent("premium_click", { plan: "Pro", method: "paypal", status: "approved" });
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
  const addEmailCapture = useAppStore((s) => s.addEmailCapture);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  useEffect(() => {
    trackPremiumView("premium_page");
  }, []);

  function startCardCheckout() {
    setLoading(true);
    setError(null);
    trackEvent("premium_click", { plan: "Pro", method: "stripe" });

    if (!user) {
      if (STRIPE_PRO_LINK) {
        window.location.href = STRIPE_PRO_LINK;
        return;
      }
      window.location.href = "/login?next=/premium";
      return;
    }

    fetch("/api/billing/checkout", { method: "POST", credentials: "include" })
      .then(async (r) => {
        const d = await r.json().catch(() => null) as { url?: string; error?: string } | null;
        if (r.ok && d?.url) { window.location.href = d.url; return; }
        if (STRIPE_PRO_LINK) { window.location.href = STRIPE_PRO_LINK; return; }
        const reason = d?.error ?? `Checkout server returned ${r.status}`;
        throw new Error(`${reason}. Try PayPal below or contact support@referrals.live.`);
      })
      .catch((err) => {
        if (STRIPE_PRO_LINK) { window.location.href = STRIPE_PRO_LINK; return; }
        setError(err instanceof Error ? err.message : "Unable to start checkout");
        setLoading(false);
      });
  }

  async function joinWaitlist(e: FormEvent) {
    e.preventDefault();
    setWaitlistError(null);
    try {
      await addEmailCapture(waitlistEmail.trim(), "pro-waitlist");
      setWaitlistDone(true);
      trackEvent("pro_waitlist_join", {});
    } catch {
      setWaitlistError("Couldn't save that email — try again, or email support@referrals.live.");
    }
  }

  const cardCheckoutAvailable = Boolean(user) || Boolean(STRIPE_PRO_LINK);
  const paypalAvailable = Boolean(PAYPAL_CLIENT_ID && PAYPAL_PLAN_ID);

  return (
    <div>
      <Seo
        title="Pro — post your referral links | referrals.live"
        description="Browsing deals is free forever. Pro lets you post your own referral links publicly, pin 2 featured homepage placements, and track every click."
        path="/premium"
      />

      {/* Header */}
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">For posters</div>
      <h1 className="font-display text-4xl font-extrabold text-white">Go Pro — put your links where the clicks are</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Browsing and grabbing deals on referrals.live is <span className="font-semibold text-white">free forever</span> —
        no account needed. Pro is for the other side of the model:{" "}
        <span className="font-semibold text-white">posting your own referral links</span> in the public
        catalog so visitors sign up through <em>your</em> links and you earn the referral credits.
      </p>

      {/* Free vs Pro */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="glass rounded-3xl border border-white/10 p-6">
          <div className="font-display text-xl font-bold text-white">Free — forever</div>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li>✓ Browse and click every deal in the catalog</li>
            <li>✓ Save links on your private member board</li>
            <li>✓ Vote on deals and read the community chat</li>
          </ul>
          <Link to="/browse" className="mt-5 inline-flex rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-gold/40">
            Browse free deals →
          </Link>
        </div>
        <div className="glass rounded-3xl border border-gold/40 p-6 shadow-gold">
          <div className="flex items-baseline justify-between">
            <div className="font-display text-xl font-bold text-white">Pro</div>
            <div className="font-display text-2xl font-extrabold text-gold">{PRO_PRICE_LABEL}</div>
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {perks.map((p) => (
              <li key={p.text} className="flex items-start gap-2.5">
                <span className="mt-0.5 leading-none">{p.icon}</span>
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left: checkout */}
        <div className="space-y-6">
          <div className="glass rounded-3xl border border-white/10 p-6">
            <div className="font-display text-2xl font-bold text-white">Start posting</div>
            <p className="mt-1 text-xs text-muted">Recurring subscription — cancel anytime from your dashboard. Access activates as soon as payment confirms.</p>

            <div className="mt-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted/60">Credit / Debit Card</div>
              {cardCheckoutAvailable ? (
                <button
                  type="button"
                  onClick={startCardCheckout}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-amber-500 px-6 py-4 text-sm font-bold text-black transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                >
                  {loading ? "Connecting to Stripe…" : `Go Pro — ${PRO_PRICE_LABEL}`}
                </button>
              ) : (
                <Link
                  to="/login?next=/premium"
                  className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold text-white hover:bg-white/10"
                >
                  Sign in to upgrade
                </Link>
              )}

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted/60">Or pay with PayPal</div>
                <PayPalButton />
                {!paypalAvailable && !cardCheckoutAvailable ? (
                  <p className="text-xs leading-relaxed text-muted">
                    Online checkout opens as soon as the payment link is switched on. Join the
                    waitlist below and you'll be first to know — no charge today, no fake checkout.
                  </p>
                ) : null}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-100">
                <div className="font-bold mb-1">Checkout Error</div>
                {error}
              </div>
            )}

            {/* Waitlist — the honest fallback when no checkout is configured */}
            {!cardCheckoutAvailable && !paypalAvailable ? (
              <form onSubmit={joinWaitlist} className="mt-6 rounded-2xl border border-gold/25 bg-gold/5 p-5">
                <div className="text-sm font-bold text-white">Join the Pro waitlist</div>
                <p className="mt-1 text-xs leading-relaxed text-muted">We'll email you the moment Pro checkout opens.</p>
                {waitlistDone ? (
                  <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">✓ You're on the list — watch your inbox.</p>
                ) : (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <label className="sr-only" htmlFor="pro-waitlist-email">Email</label>
                    <input
                      id="pro-waitlist-email"
                      type="email"
                      required
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none ring-gold/30 focus:ring"
                    />
                    <button type="submit" className="shrink-0 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-5 py-3 text-sm font-bold text-black hover:brightness-110">
                      Notify me
                    </button>
                  </div>
                )}
                {waitlistError ? <p className="mt-2 text-xs text-red-300">{waitlistError}</p> : null}
              </form>
            ) : null}
          </div>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-5">
          <div className="glass rounded-3xl border border-white/10 p-5 text-sm text-muted">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-electric">Your status</div>
            <div className="mt-2 text-lg font-semibold text-white">
              {user?.premium ? "✅ Pro active" : "⬜ Free tier"}
            </div>
            {!user?.premium && (
              <p className="mt-3 rounded-xl bg-white/5 p-3 text-xs leading-relaxed">
                With Pro, your links leave your private board and go public in the catalog — where
                every visitor click can turn into your referral credit.
              </p>
            )}
          </div>

          <div className="glass rounded-3xl border border-white/10 p-5 space-y-4 text-xs text-muted">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white">FAQ</div>
            {[
              ["Can I cancel?", "Yes — anytime from your dashboard. No fees, no friction."],
              ["When does access start?", "As soon as Stripe or PayPal confirms payment."],
              ["What can I post?", "Your own referral links for real programs. Listings are reviewed for dead links and spam."],
              ["Is browsing still free?", "Always. Pro only unlocks posting and featured placement — deals stay free for everyone."],
            ].map(([q, a]) => (
              <div key={q}>
                <div className="font-semibold text-white/80">{q}</div>
                <div className="mt-0.5 leading-relaxed">{a}</div>
              </div>
            ))}
          </div>

          <div className="glass rounded-3xl border border-white/10 p-5 text-xs text-muted">
            <div className="font-bold text-white mb-1">Need help?</div>
            <a href="mailto:support@referrals.live" className="text-gold hover:underline">support@referrals.live</a>
          </div>
        </div>
      </div>
    </div>
  );
}
