import type { Env } from "../../_lib";
import { badRequest, json, now, parseJson, uid } from "../../_lib";
import { requireUser } from "../../_session";

const REASONS = new Set(["spam", "broken", "scam", "not_allowed", "offensive", "other"]);
const AUTO_HIDE_AT = 3;
const DAILY_REPORT_LIMIT = 10;
const TRUSTED_ACCOUNT_AGE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * POST /api/referrals/:id/report — any signed-in member can report a
 * listing once, up to 10 reports a day. Three reports from trusted
 * accounts (Premium, or at least 3 days old) hide a member listing
 * (terms_flagged=1) and drop its Top Spot until an admin reviews it.
 * Catalog rows are never auto-hidden; their reports just queue for the admin.
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
  const today = await db
    .prepare("SELECT COUNT(*) AS n FROM listing_reports WHERE reporter_key=? AND created_at>?")
    .bind(user.id, ts - 24 * 60 * 60 * 1000)
    .first<any>();
  if (Number(today?.n ?? 0) >= DAILY_REPORT_LIMIT) {
    return json({ ok: false, error: "You've reached today's report limit. Thanks for helping keep the site clean." }, { status: 429 });
  }
  try {
    await db
      .prepare("INSERT INTO listing_reports (id, referral_id, reporter_key, reason, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(uid("rpt"), id, user.id, reason, ts)
      .run();
  } catch {
    return json({ ok: true, alreadyReported: true });
  }

  // Only trusted reporters count toward the auto-hide, so throwaway accounts can't bury a listing.
  const count = await db
    .prepare(
      `SELECT COUNT(DISTINCT lr.reporter_key) AS n
       FROM listing_reports lr
       JOIN users u ON u.id=lr.reporter_key
       LEFT JOIN subscriptions s ON s.user_id=u.id
       WHERE lr.referral_id=? AND (u.created_at<? OR s.status='active')`,
    )
    .bind(id, ts - TRUSTED_ACCOUNT_AGE_MS)
    .first<any>();
  const n = Number(count?.n ?? 0);
  let hidden = false;
  if (row.user_id !== "user-system" && n >= AUTO_HIDE_AT) {
    await db.batch([
      db.prepare("UPDATE referrals SET terms_flagged=1, updated_at=? WHERE id=?").bind(ts, id),
      db.prepare("DELETE FROM featured_slots WHERE referral_id=?").bind(id),
      db
        .prepare("INSERT INTO moderation_log (id, referral_id, actor, action, note, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(uid("mod"), id, "auto", "auto_hidden", `${n} member reports`, ts),
    ]);
    hidden = true;
  }
  return json({ ok: true, hidden });
}
