import type { Env } from "../_lib";
import { json } from "../_lib";
import { requireUser } from "../_session";
import { isPremiumSubscription, normalizeStatus, periodEndMs, stripeGet, upsertSubscription } from "./webhook";

/**
 * Lets a member cancel (at the end of the paid period) or resume their own
 * referrals.live Premium subscription. Only touches a subscription that is
 * stored on the member's own row and that belongs to this site.
 */

async function loadOwnSubscription(env: Env, userId: string) {
  const row = await env.DB.prepare("SELECT stripe_customer_id, stripe_sub_id FROM subscriptions WHERE user_id=? LIMIT 1")
    .bind(userId)
    .first<any>();
  const subId = String(row?.stripe_sub_id ?? "");
  if (!/^sub_[A-Za-z0-9]{6,120}$/.test(subId)) return null;
  const sub = await stripeGet(env, `/v1/subscriptions/${encodeURIComponent(subId)}`);
  if (!sub?.id) return null;
  const ours = isPremiumSubscription(env, sub);
  const sameCustomer = !row?.stripe_customer_id || String(sub.customer ?? "") === String(row.stripe_customer_id);
  return ours && sameCustomer ? { sub, customerId: String(sub.customer ?? row?.stripe_customer_id ?? "") || null } : null;
}

function view(sub: any) {
  return {
    ok: true as const,
    hasSubscription: true,
    status: normalizeStatus(sub.status),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    currentPeriodEnd: periodEndMs(sub) ?? 0,
  };
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!context.env.STRIPE_SECRET_KEY) return json({ ok: true, hasSubscription: false });
  const found = await loadOwnSubscription(context.env, user.id);
  if (!found) return json({ ok: true, hasSubscription: false });
  return json(view(found.sub), { headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!context.env.STRIPE_SECRET_KEY) return json({ ok: false, error: "Billing not configured" }, { status: 503 });

  const body = (await context.request.json().catch(() => ({}))) as { action?: unknown };
  const action = body.action === "cancel" || body.action === "resume" ? body.action : null;
  if (!action) return json({ ok: false, error: "action must be cancel or resume" }, { status: 400 });

  const found = await loadOwnSubscription(context.env, user.id);
  if (!found) return json({ ok: false, error: "No Premium subscription found on this account" }, { status: 404 });
  if (normalizeStatus(found.sub.status) !== "active") {
    return json({ ok: false, error: "This subscription has already ended" }, { status: 409 });
  }

  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(found.sub.id)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${context.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ cancel_at_period_end: action === "cancel" ? "true" : "false" }).toString(),
  });
  const updated = (await res.json().catch(() => null)) as any;
  if (!res.ok || !updated?.id) {
    return json({ ok: false, error: "Stripe could not update the subscription. Try again in a minute." }, { status: 502 });
  }

  // Access stays until the paid period ends; the deleted webhook ends it.
  await upsertSubscription(context.env.DB, user.id, {
    customerId: found.customerId,
    subscriptionId: updated.id,
    status: normalizeStatus(updated.status),
    periodEnd: periodEndMs(updated),
  });
  await context.env.DB.prepare("INSERT INTO audit_log (id, user_id, action, meta_json, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), user.id, action === "cancel" ? "billing.cancel" : "billing.resume", JSON.stringify({ subscription: updated.id }), Date.now())
    .run()
    .catch(() => null);

  return json(view(updated));
}
