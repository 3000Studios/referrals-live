import type { Env } from "./_lib";
import { json, now } from "./_lib";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const ts = now();
  const featured = await context.env.DB.prepare(
    `SELECT r.id, r.title, r.description, r.url, r.category, r.tags_json, r.image_url, r.created_at, m.votes, m.clicks
     FROM featured_slots f
     JOIN referrals r ON r.id=f.referral_id
     LEFT JOIN referral_metrics m ON m.referral_id=r.id
     WHERE f.ends_at>? 
     ORDER BY f.created_at DESC
     LIMIT 12`,
  )
    .bind(ts)
    .all<any>();

  const offers = (featured.results ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    url: r.url,
    category: r.category,
    tags: JSON.parse(r.tags_json ?? "[]"),
    image: r.image_url,
    votes: Number(r.votes ?? 0),
    clicks: Number(r.clicks ?? 0),
    createdAt: Number(r.created_at),
    visibility: "public",
    featured: true,
  }));

  return json({ ok: true, featured: offers });
}

