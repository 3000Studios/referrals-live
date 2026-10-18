/**
 * Owner featured links + Pro checkout config — REBUILD 2026-10-18.
 *
 * These are the ONLY places these values live in the frontend. To point a
 * feature at the owner's personal link, change the one value here.
 */

/**
 * ★ MUSE — Featured #1 in the hero.
 * BOSS: replace this with your personal Muse invite link (from the Muse
 * app's Invite / gift button). One line — the hero panel, its copy and its
 * tracking all read from here. Until then it points at muse.ai so the panel
 * is live and honest (no invented invite code).
 */
export const MUSE_INVITE_URL = "https://muse.ai";

/** Honey — the owner's personal referral link (given 2026-10-18). */
export const HONEY_REF_URL = "https://joinhoney.com/ref/a4g6fs4";

/**
 * Pro checkout. Driven by the VITE_STRIPE_PAYMENT_LINK env var (a Stripe
 * Payment Link). When empty, the Pro page does NOT fake a checkout — it
 * captures emails to the Pro waitlist via /api/email-capture instead.
 * Logged-in members can also use the tracked checkout at
 * /api/billing/checkout when Stripe keys are configured server-side.
 */
export const STRIPE_PRO_LINK =
  (import.meta.env.VITE_STRIPE_PAYMENT_LINK as string | undefined) ?? "";

export const PRO_PRICE_LABEL = "$7.99/mo";
