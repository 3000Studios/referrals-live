import type { Env } from "../_lib";
import { json, now } from "../_lib";

export async function onRequestGet(context: { request: Request; env: Env; params: { id: string } }) {
  const id = context.params.id;
  const ts = now();

  const referral = await context.env.DB.prepare(
    `SELECT r.id, r.user_id, r.title, r.description, r.url, r.category, r.tags_json, r.image_url, r.created_at, COALESCE(m.votes,0) votes, COALESCE(m.clicks,0) clicks
     FROM referrals r
     LEFT JOIN referral_metrics m ON m.referral_id=r.id
     WHERE r.id=? AND r.status='public' AND (r.user_id='user-system' OR r.terms_flagged=0)
     LIMIT 1`,
  )
    .bind(id)
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
  const votes = Number(row.votes ?? 0);
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
      verified: votes >= 25 || clicks >= 150,
      owner: referral ? (referral.user_id === "user-system" ? "system" : "member") : "system",
      related: relatedRows.results ?? [],
    },
  });
}
