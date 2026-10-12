import type { Env } from "./api/_lib";

function xmlEscape(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

// Evergreen articles bundled in src/data/blogArticles.ts. They render via the static
// fallback even when the DB has no matching row, so they must be listed for indexing.
// Keep in sync with src/data/blogArticles.ts.
const STATIC_BLOG_SLUGS = [
  "how-referral-links-make-money",
  "referral-vs-affiliate-vs-influencer",
  "promote-referral-links-without-spamming",
  "cashback-signup-bonus-stacking-guide",
  "best-referral-programs-2026",
  "passive-income-ideas-that-scale",
  "affiliate-marketing-for-beginners",
  "high-paying-referral-apps",
  "credit-card-referral-strategy",
  "crypto-exchange-referrals-safely",
  "saas-referral-programs-b2b",
  "content-seo-for-affiliate-sites",
  "email-list-building-affiliates",
  "tracking-clicks-conversions",
  "avoiding-referral-program-violations",
  "fintech-referral-bonuses",
  "travel-rewards-referrals",
  "ecommerce-affiliate-playbook",
  "building-a-referral-brand",
  "avoiding-referral-scams-red-flags",
  "building-referral-income-from-a-small-newsletter",
  "how-creators-vet-referral-partners-before-promoting",
  "how-referral-programs-actually-pay-beginners-breakdown",
  "how-to-disclose-affiliate-links-ftc-plain-english",
  "how-to-rank-referral-offers-without-spamming-friends",
  "how-to-write-a-referral-review-people-trust",
  "recurring-vs-one-time-referral-payouts-the-math",
  "referral-link-placement-where-clicks-actually-come-from",
  "referral-vs-affiliate-vs-creator-codes-difference",
  "side-hustles-you-can-start-with-zero-audience",
  "tax-basics-for-referral-income-us",
  "tiered-referral-programs-explained",
  "using-qr-codes-for-in-person-referrals",
  "when-to-say-no-to-a-referral-deal",
];

export async function onRequestGet(context: { env: Env }) {
  const origin = String(context.env.APP_ORIGIN ?? "https://referrals.live").replace(/\/+$/, "");
  const rows = await context.env.DB.prepare("SELECT slug, published_at FROM blog_posts ORDER BY published_at DESC LIMIT 500").all<any>();
  const posts = rows.results ?? [];

  const dbSlugs = new Set(posts.map((p: any) => String(p.slug)));
  const staticPaths = ["/", "/browse", "/categories", "/leaderboard", "/blog", "/premium", "/submit", "/testimonials", "/analytics", "/about", "/contact", "/privacy", "/terms", "/disclosure", "/disclaimer"];
  const urls = [
    ...staticPaths.map((p) => ({ loc: `${origin}${p}`, lastmod: null })),
    ...posts.map((p: any) => ({
      loc: `${origin}/blog/${encodeURIComponent(String(p.slug))}`,
      lastmod: new Date(Number(p.published_at ?? Date.now())).toISOString(),
    })),
    ...STATIC_BLOG_SLUGS.filter((s) => !dbSlugs.has(s)).map((s) => ({
      loc: `${origin}/blog/${encodeURIComponent(s)}`,
      lastmod: null,
    })),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls
      .map((u) => {
        const loc = xmlEscape(u.loc);
        const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : "";
        return `<url><loc>${loc}</loc>${lastmod}</url>`;
      })
      .join("") +
    `</urlset>`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}

