import type { Env } from "../_lib";
import { json } from "../_lib";
import { requireUser } from "../_session";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const rows = await context.env.DB.prepare(
    `SELECT r.id, r.title, r.description, r.url, r.category, r.tags_json, r.image_url, r.status, r.created_at, r.updated_at,
            m.votes, m.clicks
     FROM referrals r
     LEFT JOIN referral_metrics m ON m.referral_id=r.id
     WHERE r.user_id=?
     ORDER BY r.created_at DESC
     LIMIT 200`,
  )
    .bind(user.id)
    .all<any>();

  const referrals = (rows.results ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    url: r.url,
    category: r.category,
    tags: JSON.parse(r.tags_json ?? "[]"),
    image: r.image_url,
    status: r.status,
    votes: Number(r.votes ?? 0),
    clicks: Number(r.clicks ?? 0),
    createdAt: Number(r.created_at),
  }));

  return json({ ok: true, referrals });
}

