import type { Env } from "../_lib";
import { badRequest, json, now, parseJson, uid } from "../_lib";
import { requireUser } from "../_session";

/**
 * Admin moderation queue for member listings.
 * GET  -> pending (public_candidate), hidden (flagged) and recently
 *         published member listings, each with its report count.
 * POST {id, action} where action is approve | hide | restore | make_private.
 */
export async function onRequestGet(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return json({ ok: false, error: "Forbidden" }, { status: 403 });

  const rows = await context.env.DB.prepare(
    `SELECT r.id, r.title, r.url, r.status, r.terms_attested, r.terms_flagged, r.created_at, u.display_name AS poster,
            (SELECT COUNT(*) FROM listing_reports lr WHERE lr.referral_id=r.id) AS reports
     FROM referrals r
     LEFT JOIN users u ON u.id=r.user_id
     WHERE r.user_id<>'user-system'
       AND (r.status='public_candidate' OR r.terms_flagged=1 OR r.status='public'
            OR EXISTS (SELECT 1 FROM listing_reports lr2 WHERE lr2.referral_id=r.id))
     ORDER BY r.terms_flagged DESC, (r.status='public_candidate') DESC, r.created_at DESC
     LIMIT 200`,
  ).all<any>();

  const items = (rows.results ?? []).map((r: any) => ({
    id: String(r.id),
    title: String(r.title),
    url: String(r.url),
    status: String(r.status),
    termsAttested: Number(r.terms_attested ?? 0) === 1,
    hidden: Number(r.terms_flagged ?? 0) === 1,
    reports: Number(r.reports ?? 0),
    poster: String(r.poster ?? "Member"),
    createdAt: Number(r.created_at ?? 0),
  }));
  return json({ ok: true, items });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await parseJson<{ id?: string; action?: string }>(context.request);
  const id = String(body.id ?? "");
  const action = String(body.action ?? "");
  if (!id) return badRequest("Missing id.");

  const db = context.env.DB;
  const row = await db.prepare("SELECT id, user_id FROM referrals WHERE id=? LIMIT 1").bind(id).first<any>();
  if (!row || row.user_id === "user-system") return json({ ok: false, error: "Not found" }, { status: 404 });

  const ts = now();
  let update: D1PreparedStatement;
  if (action === "approve") update = db.prepare("UPDATE referrals SET status='public', terms_flagged=0, updated_at=? WHERE id=?").bind(ts, id);
  else if (action === "hide") update = db.prepare("UPDATE referrals SET terms_flagged=1, updated_at=? WHERE id=?").bind(ts, id);
  else if (action === "restore") update = db.prepare("UPDATE referrals SET terms_flagged=0, updated_at=? WHERE id=?").bind(ts, id);
  else if (action === "make_private") update = db.prepare("UPDATE referrals SET status='private', updated_at=? WHERE id=?").bind(ts, id);
  else return badRequest("Unknown action.");

  await db.batch([
    update,
    db
      .prepare("INSERT INTO moderation_log (id, referral_id, actor, action, note, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(uid("mod"), id, user.id, action, null, ts),
  ]);
  return json({ ok: true });
}
