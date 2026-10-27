/**
 * ★ SUBSCRIPTION CONFIG — the single place the Premium offer is wired.
 *
 * Price: $3.99/month, single tier, monthly only (Boss-fixed 2026-10-27).
 *
 * Checkout: the guest checkout button reads SUBSCRIPTION_CHECKOUT_URL,
 * which is fed by the VITE_STRIPE_PAYMENT_LINK env var (a Stripe Payment
 * Link) via STRIPE_PRO_LINK in src/data/featured.ts. DESK: to switch guest
 * checkout on, set VITE_STRIPE_PAYMENT_LINK in the Pages project env and
 * redeploy — no code change. Until then the value is "" and the Premium
 * page honestly falls back to the waitlist (no fake checkout). Logged-in
 * members can also check out via the tracked /api/billing/checkout when
 * the server-side Stripe keys are configured.
 */
import { PRO_PRICE_LABEL, STRIPE_PRO_LINK } from "./featured";

/** Displayed price label for the single Premium tier. */
export const SUBSCRIPTION_PRICE_LABEL = PRO_PRICE_LABEL; // "$3.99/mo"

/** Guest checkout URL (Stripe Payment Link). "" until the desk sets the env var. */
export const SUBSCRIPTION_CHECKOUT_URL = STRIPE_PRO_LINK;
