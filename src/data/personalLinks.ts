/**
 * The owner's OWN referral links — the hero carousel data set.
 *
 * The homepage hero carousel is generated from this list: add an entry and
 * a card appears in the rotation, no component changes needed. Only links
 * whose program terms ALLOW public posting belong here.
 *
 * HELD links (terms-barred for public posting — e.g. SoFi, per the owner
 * ruling of 2026-10-27) live in HELD-LINKS.md at the repo root and must
 * NEVER be added here. See ~/workspace/referrals-live/TOP-PROGRAMS-2026-10-27.md
 * for the per-program public-posting verdicts.
 */
export type PersonalLink = {
  id: string;
  /** Program / brand name shown on the card. */
  name: string;
  /** Short bonus headline — what the visitor gets. Keep it factual. */
  bonus: string;
  /** The offer terms, stated exactly as the program states them. */
  terms: string;
  /** Category label shown as a chip. */
  categoryLabel: string;
  /** The owner's personal referral URL (verbatim). */
  url: string;
  /** Card image (brand favicon or hosted image). */
  image: string;
  ctaLabel: string;
};

export const personalLinks: PersonalLink[] = [
  {
    id: "owner-honey",
    name: "Honey",
    bonus: "Automatic coupons + Gold rewards",
    terms:
      "Join Honey free with the owner's link. Honey hunts for coupon codes while you shop — you save money and earn Gold rewards, and the owner earns Honey Gold when you join.",
    categoryLabel: "Shopping & Rewards",
    url: "https://joinhoney.com/ref/a4g6fs4",
    image: "https://www.google.com/s2/favicons?domain=joinhoney.com&sz=256",
    ctaLabel: "Join Honey — it's free",
  },
  // Harvested owner links (Chime, Rakuten, Discover, …) drop in here as the
  // desk verifies each one against the program's public-posting terms.
];
