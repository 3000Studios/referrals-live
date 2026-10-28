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
 * SoFi personal invite links are PRIVATE-ONLY by owner ruling 2026-10-27
 * (SoFi's terms bar public distribution). They live in HELD-LINKS.md at the
 * repo root — never add them to this file or anywhere in the shipped bundle.
 */

/**
 * Pro checkout. Driven by the VITE_STRIPE_PAYMENT_LINK env var (a Stripe
 * Payment Link), with the current live $3.99/mo link as the fallback
 * default. The env var IS set in the Pages project (production + preview,
 * 2026-10-28), but Pages git builds on this project provably do not
 * inline API-set env vars (verified across three builds, incl. one with
 * build caching disabled — the bundle came out byte-identical with an
 * empty link), so the fallback is what ships; the env var still wins
 * wherever a build does inline it. Link record: PAYMENT-LINKS.md (desk
 * workspace). The retired $7.99/mo link was deactivated in Stripe —
 * never reintroduce it. When no link is available at all, the Pro page
 * does NOT fake a checkout — it captures emails to the Pro waitlist via
 * /api/email-capture instead. Logged-in members can also use the
 * tracked checkout at /api/billing/checkout when Stripe keys are
 * configured server-side.
 */
export const STRIPE_PRO_LINK =
  (import.meta.env.VITE_STRIPE_PAYMENT_LINK as string | undefined) ??
  "https://buy.stripe.com/dRm4gz84R16ufZS1ZwbAs14";

/** Premium price — Boss-fixed 2026-10-27: single tier, $3.99/month, monthly only. */
export const PRO_PRICE_LABEL = "$3.99/mo";
