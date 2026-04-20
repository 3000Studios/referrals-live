import type { Env } from "../_lib";
import { badRequest, json, now } from "../_lib";
import { requireUser } from "../_session";

type SetBody = { slot: 1 | 2; referralId: string };

export async function onRequestGet(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const ts = now();
  const rows = await context.env.DB.prepare(
    "SELECT slot_index, referral_id, starts_at, ends_at FROM featured_slots WHERE user_id=? AND ends_at>? ORDER BY slot_index ASC",
  )
    .bind(user.id, ts)
    .all<any>();
  const slots = (rows.results ?? []).map((r: any) => ({
    slot: Number(r.slot_index),
    referralId: r.referral_id,
    startsAt: Number(r.starts_at),
    endsAt: Number(r.ends_at),
  }));
  return json({ ok: true, slots });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!user.premium) return json({ ok: false, error: "Premium required" }, { status: 402 });

  const body = (await context.request.json()) as SetBody;
  const slot = body?.slot;
  const referralId = (body?.referralId ?? "").trim();
  if (slot !== 1 && slot !== 2) return badRequest("Slot must be 1 or 2.");
  if (!referralId) return badRequest("Missing referralId.");

  const owned = await context.env.DB.prepare("SELECT id FROM referrals WHERE id=? AND user_id=? LIMIT 1")
    .bind(referralId, user.id)
    .first<any>();
  if (!owned) return json({ ok: false, error: "Referral not found" }, { status: 404 });

  const ts = now();
  const days = Number(context.env.SESSION_DAYS ?? "30") || 30;
  const endsAt = ts + days * 24 * 60 * 60 * 1000;

  await context.env.DB.prepare(
    "INSERT OR REPLACE INTO featured_slots (user_id, slot_index, referral_id, starts_at, ends_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(user.id, slot, referralId, ts, endsAt, ts)
    .run();

  return json({ ok: true });
}

