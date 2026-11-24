import type { Env } from "./_lib";
import { json, now } from "./_lib";

/**
 * GET /api/top-spots — paid Top Spots.
 *
 * Each Premium member can pin up to two of their own live listings. A pin
 * shows here only while the member's subscription is active and the listing
 * is public and not hidden by moderation. These are paid placements, so the
 * site labels them Sponsored wherever they render.
 */
export async function onRequestGet(context: { request: Request; env: Env }) {
  const ts = now();
  const rows = await context.env.DB.prepare(
    `SELECT r.id, r.title, r.description, r.category, r.tags_json, r.image_url, f.ends_at, u.display_name AS poster,
            COALESCE(m.clicks, 0) AS clicks, COALESCE(m.votes, 0) AS votes
     FROM featured_slots f
     JOIN referrals r ON r.id=f.referral_id AND r.user_id=f.user_id
     JOIN users u ON u.id=f.user_id
     JOIN subscriptions s ON s.user_id=f.user_id
     LEFT JOIN referral_metrics m ON m.referral_id=r.id
     WHERE f.ends_at>?
       AND r.status='public' AND r.terms_flagged=0 AND r.terms_attested=1
       AND f.user_id<>'user-system'
       AND s.status='active' AND (s.current_period_end IS NULL OR s.current_period_end=0 OR s.current_period_end>?)
     ORDER BY f.created_at DESC
     LIMIT 8`,
  )
    .bind(ts, ts)
    .all<any>();

  const spots = (rows.results ?? []).map((r: any) => ({
    id: String(r.id),
    title: String(r.title),
    description: String(r.description),
    category: String(r.category),
    tags: JSON.parse(r.tags_json ?? "[]"),
    image: String(r.image_url),
    poster: String(r.poster ?? "Member").slice(0, 40),
    clicks: Number(r.clicks ?? 0),
    votes: Number(r.votes ?? 0),
    endsAt: Number(r.ends_at),
  }));

  return json(
    { ok: true, spots },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
