import type { Env } from "../api/_lib";
import { now } from "../api/_lib";

export async function onRequestGet(context: { request: Request; env: Env; params: { id: string } }) {
  const id = context.params.id;
  if (!id) return new Response("Missing id", { status: 400 });
  const db = context.env.DB;
  const ts = now();
  const row = await db
    .prepare(
      `SELECT r.url as url
       FROM referrals r
       LEFT JOIN featured_slots f ON f.referral_id=r.id AND f.ends_at>?
       WHERE r.id=? AND (r.status='public' OR f.referral_id IS NOT NULL)
       LIMIT 1`,
    )
    .bind(ts, id)
    .first<any>();
  if (!row?.url) return new Response("Not found", { status: 404 });

  await db
    .prepare("UPDATE referral_metrics SET clicks=clicks+1, last_click_at=? WHERE referral_id=?")
    .bind(ts, id)
    .run();

  let out = row.url as string;
  try {
    const u = new URL(out);
    const domain = u.hostname.replace(/^www\./, "").toLowerCase();
    const attr = await db.prepare("SELECT params_json FROM owner_attribution WHERE domain=? LIMIT 1").bind(domain).first<any>();
    if (attr?.params_json) {
      const params = JSON.parse(attr.params_json) as Record<string, string>;
      Object.entries(params).forEach(([k, v]) => {
        if (!k || !v) return;
        u.searchParams.set(k, v);
      });
      u.searchParams.set("utm_source", "referrals_live");
      u.searchParams.set("utm_medium", "curated_public");
      u.searchParams.set("utm_campaign", "owner_attribution");
      out = u.toString();
    }
  } catch {
    // keep original
  }

  return Response.redirect(out, 302);
}
