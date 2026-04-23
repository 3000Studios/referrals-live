import type { Env } from "./_lib";
import { json, now } from "./_lib";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const ts = now();
  const setting = await context.env.DB.prepare("SELECT value_json FROM site_settings WHERE key='automation' LIMIT 1").first<any>();
  const automation = setting?.value_json ? JSON.parse(setting.value_json) : { autoFeatureAttributedFeed: true, autoFeatureLimit: 4 };
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

  const autoRows =
    automation?.autoFeatureAttributedFeed !== false
      ? await context.env.DB.prepare(
          `SELECT i.id, i.title, i.description, i.url, i.category, i.tags_json, i.image_url, i.created_at, i.score
           FROM ingested_offers i
           JOIN owner_attribution oa
             ON LOWER(REPLACE(REPLACE(substr(i.url, instr(i.url, '//') + 2), 'www.', ''), '/', '')) LIKE '%' || oa.domain || '%'
           ORDER BY i.score DESC, i.updated_at DESC
           LIMIT ?`,
        )
          .bind(Number(automation?.autoFeatureLimit ?? 4))
          .all<any>()
      : { results: [] };

  const autoFeatured = (autoRows.results ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    url: r.url,
    category: r.category,
    tags: JSON.parse(r.tags_json ?? "[]"),
    image: r.image_url,
    votes: 0,
    clicks: 0,
    createdAt: Number(r.created_at),
    visibility: "public",
    featured: true,
    source: "automation",
  }));

  const merged = [...offers, ...autoFeatured].filter((item, index, arr) => arr.findIndex((x) => x.id === item.id) === index).slice(0, 12);
  return json({ ok: true, featured: merged });
}
