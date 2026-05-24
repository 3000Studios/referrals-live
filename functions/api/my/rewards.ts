import type { Env } from "../_lib";
import { badRequest, json, now } from "../_lib";
import { requireUser } from "../_session";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(context.request.url);
    const status = url.searchParams.get("status") ?? "all"; // all, pending, earned, paid

    const query =
      status === "all"
        ? `SELECT id, referral_program_id, referee_id, referrer_bonus_cents, status, reason, created_at, earned_at
           FROM rewards WHERE referrer_id = ? ORDER BY created_at DESC LIMIT 100`
        : `SELECT id, referral_program_id, referee_id, referrer_bonus_cents, status, reason, created_at, earned_at
           FROM rewards WHERE referrer_id = ? AND status = ? ORDER BY created_at DESC LIMIT 100`;

    const rows = await (status === "all"
      ? context.env.DB.prepare(query).bind(user.id)
      : context.env.DB.prepare(query).bind(user.id, status)
    ).all<any>();

    const rewards = (rows.results ?? []).map((r: any) => ({
      id: r.id,
      programId: r.referral_program_id,
      refereeId: r.referee_id,
      bonus: r.referrer_bonus_cents / 100,
      status: r.status,
      reason: r.reason,
      createdAt: r.created_at,
      earnedAt: r.earned_at,
    }));

    return json({ ok: true, rewards });
  } catch (e) {
    console.error("Rewards error:", e);
    return json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await context.request.json()) as { referralId: string; bonusAmount: number };
    if (!body.referralId) return badRequest("referralId required");
    if (!body.bonusAmount || body.bonusAmount <= 0) return badRequest("bonusAmount must be positive");

    const id = `reward_${Date.now()}`;
    const ts = now();
    const bonusCents = Math.round(body.bonusAmount * 100);

    await context.env.DB.prepare(
      `INSERT INTO rewards (id, referrer_id, referral_program_id, referrer_bonus_cents, status, reason, created_at)
       VALUES (?, ?, ?, ?, 'earned', 'manual_bonus', ?)`
    )
      .bind(id, user.id, body.referralId, bonusCents, ts)
      .run();

    return json({ ok: true, rewardId: id });
  } catch (e) {
    console.error("Rewards POST error:", e);
    return json({ ok: false, error: String(e) }, { status: 500 });
  }
}
