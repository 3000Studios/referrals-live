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
  {
    id: "owner-usmobile",
    name: "US Mobile",
    bonus: "Referral rewards on prepaid phone plans",
    terms:
      "Join US Mobile through the owner's link and referral rewards apply under US Mobile's current referral terms. Prepaid phone plans on major US networks.",
    categoryLabel: "Mobile & Wireless",
    url: "https://www.usmobile.com/referrals?referrer=B15A26AD&name=Incoming&utm_page_url=monster_referral",
    image: "https://www.google.com/s2/favicons?domain=usmobile.com&sz=256",
    ctaLabel: "Join US Mobile",
  },
  {
    id: "owner-grant",
    name: "Grant",
    bonus: "Get a bonus when you join",
    terms:
      "Join through the owner's invite and you'll get a bonus when you join, under Grant's current referral terms. Grant offers cash advances of $25–$500 with no credit check (eligibility and full terms at grantcash.com/legal).",
    categoryLabel: "Fintech & Banking",
    url: "https://grantcash.onelink.me/Kt7A?af_xp=referral&pid=user_referral&c=user_referral&deep_link_value=user_referral&deep_link_sub1=UXZME5GPMK",
    image: "https://www.google.com/s2/favicons?domain=grantcash.com&sz=256",
    ctaLabel: "Get the Grant app",
  },
  {
    id: "owner-freelancer",
    name: "Freelancer",
    bonus: "Connect with the owner on Freelancer",
    terms:
      "The owner's Freelancer reference-invitation link — leave a reference for 3000 Studios (TopPickJeremy) or connect about project work through his Freelancer profile.",
    categoryLabel: "SaaS & Tools",
    url: "https://www.freelancer.com/external-references/invitation/TopPickJeremy",
    image: "https://www.google.com/s2/favicons?domain=freelancer.com&sz=256",
    ctaLabel: "Open the invitation",
  },
  {
    id: "owner-g2a",
    name: "G2A",
    bonus: "Game keys, gift cards & software deals",
    terms:
      "Shop G2A through the owner's link — game keys, gift cards and digital software on the G2A marketplace; referral rewards apply under G2A's current referral terms.",
    categoryLabel: "Gaming & Marketplace",
    url: "https://www.g2a.com/n/reflink-b5f89b7398",
    image: "https://www.google.com/s2/favicons?domain=g2a.com&sz=256",
    ctaLabel: "Shop G2A deals",
  },
  // Harvested owner links (Chime, Rakuten, Discover, …) drop in here as the
  // desk verifies each one against the program's public-posting terms.
];
