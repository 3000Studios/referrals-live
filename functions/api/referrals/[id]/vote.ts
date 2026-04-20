import type { Env } from "../../_lib";
import { badRequest, json, now } from "../../_lib";
import { requireUser } from "../../_session";

export async function onRequestPost(context: { request: Request; env: Env; params: { id: string } }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Login required" }, { status: 401 });
  const id = context.params.id;
  if (!id) return badRequest("Missing id.");

  const ts = now();
  const db = context.env.DB;
  // Ensure referral exists and is public
  const exists = await db.prepare("SELECT id FROM referrals WHERE id=? AND status='public' LIMIT 1").bind(id).first<any>();
  if (!exists) return json({ ok: false, error: "Not found" }, { status: 404 });

  try {
    await db.batch([
      db.prepare("INSERT INTO referral_votes (user_id, referral_id, created_at) VALUES (?, ?, ?)").bind(user.id, id, ts),
      db.prepare("UPDATE referral_metrics SET votes=votes+1 WHERE referral_id=?").bind(id),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE") || msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("constraint")) {
      return json({ ok: false, error: "Already voted" }, { status: 409 });
    }
    throw err;
  }

  return json({ ok: true });
}
