import type { Env } from "../../_lib";
import { badRequest, json, now, parseJson, uid } from "../../_lib";
import { requireUser } from "../../_session";

const REASONS = new Set(["spam", "broken", "scam", "not_allowed", "offensive", "other"]);
const AUTO_HIDE_AT = 3;

/**
 * POST /api/referrals/:id/report — any signed-in member can report a
 * listing once. Three distinct reports on a member listing hide it
 * (terms_flagged=1) until an admin reviews it. Catalog rows are never
 * auto-hidden; their reports just queue for the admin.
 */
export async function onRequestPost(context: { request: Request; env: Env; params: { id: string } }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Log in to report a listing." }, { status: 401 });
  const id = String(context.params.id ?? "");
  if (!id) return badRequest("Missing id.");
  const body = await parseJson<{ reason?: string }>(context.request);
  const reason = REASONS.has(String(body.reason ?? "")) ? String(body.reason) : "other";

  const db = context.env.DB;
  const row = await db.prepare("SELECT id, user_id FROM referrals WHERE id=? LIMIT 1").bind(id).first<any>();
  if (!row) return json({ ok: false, error: "Not found" }, { status: 404 });
  if (row.user_id === user.id) return badRequest("You can't report your own listing.");

  const ts = now();
  try {
    await db
      .prepare("INSERT INTO listing_reports (id, referral_id, reporter_key, reason, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(uid("rpt"), id, user.id, reason, ts)
      .run();
  } catch {
    return json({ ok: true, alreadyReported: true });
  }

  const count = await db.prepare("SELECT COUNT(*) AS n FROM listing_reports WHERE referral_id=?").bind(id).first<any>();
  const n = Number(count?.n ?? 0);
  let hidden = false;
  if (row.user_id !== "user-system" && n >= AUTO_HIDE_AT) {
    await db.batch([
      db.prepare("UPDATE referrals SET terms_flagged=1, updated_at=? WHERE id=?").bind(ts, id),
      db
        .prepare("INSERT INTO moderation_log (id, referral_id, actor, action, note, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(uid("mod"), id, "auto", "auto_hidden", `${n} member reports`, ts),
    ]);
    hidden = true;
  }
  return json({ ok: true, hidden });
}
