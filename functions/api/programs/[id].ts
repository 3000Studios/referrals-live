import type { Env } from "../_lib";
import { json, now } from "../_lib";

function prosForCategory(category: string) {
  const key = category.toLowerCase();
  if (key === "fintech") return ["Fast payout potential", "Strong signup intent", "High-value referrals"];
  if (key === "saas") return ["Recurring revenue potential", "Easy to share with teams", "Good content-marketing fit"];
  if (key === "ecommerce") return ["Broad consumer appeal", "Seasonal spikes", "Strong social sharing"];
  return ["Easy to explain", "Shareable with niche audiences", "Works well with creator-led distribution"];
}

function consForCategory(category: string) {
  const key = category.toLowerCase();
  if (key === "fintech") return ["Eligibility can be geo-restricted", "Compliance copy matters", "Payout windows vary"];
  if (key === "saas") return ["Crowded category", "Need intent-driven traffic", "Program terms can change"];
  if (key === "ecommerce") return ["Lower payout per action", "Higher competition on coupons", "Short promo windows"];
  return ["Program terms change over time", "Need periodic verification", "Conversion depends on audience fit"];
}

export async function onRequestGet(context: { request: Request; env: Env; params: { id: string } }) {
  const id = context.params.id;
  const ts = now();

  const referral = await context.env.DB.prepare(
    `SELECT r.id, r.title, r.description, r.url, r.category, r.tags_json, r.image_url, r.created_at, COALESCE(m.votes,0) votes, COALESCE(m.clicks,0) clicks
     FROM referrals r
     LEFT JOIN referral_metrics m ON m.referral_id=r.id
     LEFT JOIN featured_slots f ON f.referral_id=r.id AND f.ends_at>?
     WHERE r.id=? AND (r.status='public' OR f.referral_id IS NOT NULL)
     LIMIT 1`,
  )
    .bind(ts, id)
    .first<any>();

  const ingested = !referral
    ? await context.env.DB.prepare(
        "SELECT id, title, description, url, category, tags_json, image_url, created_at, score FROM ingested_offers WHERE id=? LIMIT 1",
      )
        .bind(id)
        .first<any>()
    : null;

  const row = referral ?? ingested;
  if (!row) return json({ ok: false, error: "Not found" }, { status: 404 });

  const tags = JSON.parse(row.tags_json ?? "[]");
  const category = String(row.category ?? "general");
  const votes = Number(row.votes ?? Math.max(Number(row.score ?? 0), 0));
  const clicks = Number(row.clicks ?? 0);

  const relatedRows = await context.env.DB.prepare(
    `SELECT id, title, category
     FROM ingested_offers
     WHERE category=? AND id<>?
     ORDER BY score DESC, updated_at DESC
     LIMIT 3`,
  )
    .bind(category, row.id)
    .all<any>();

  return json({
    ok: true,
    program: {
      id: row.id,
      title: row.title,
      description: row.description,
      url: row.url,
      category,
      tags,
      image: row.image_url,
      createdAt: Number(row.created_at ?? ts),
      votes,
      clicks,
      verified: votes >= 25 || clicks >= 150 || Boolean(ingested),
      pros: prosForCategory(category),
      cons: consForCategory(category),
      howToJoin: [
        "Open the official offer page.",
        "Confirm the latest program terms on the destination site.",
        "Complete signup and follow their referral instructions.",
      ],
      reviews: [
        { author: "Community review", text: "High-intent offer with solid sharing potential if your audience already trusts this brand." },
        { author: "Growth review", text: "Best results come from niche-targeted traffic and transparent positioning." },
      ],
      related: relatedRows.results ?? [],
    },
  });
}
