import type { Env } from "../_lib";
import { json, now } from "../_lib";
import { requireUser } from "../_session";
import {
  PREMIUM_PAYMENT_LINK_ID,
  activateFromCheckout,
  isOurCheckout,
  isPremiumSubscription,
  normalizeStatus,
  periodEndMs,
  stripeGet,
  upsertSubscription,
} from "./webhook";

/**
 * Re-checks Stripe for the signed-in member's Premium subscription and
 * updates their access. Runs after checkout returns, so access never
 * depends on the webhook arriving first. Only checkouts stamped with this
 * member's account id count; a payer email never links a payment.
 */
export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!context.env.STRIPE_SECRET_KEY) return json({ ok: false, error: "Billing not configured" }, { status: 503 });

  const db = context.env.DB;

  // Each sync can make several Stripe calls on a shared account: allow 6 per 10 minutes.
  const since = now() - 10 * 60 * 1000;
  const recent = await db
    .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE user_id=? AND action='billing_sync' AND created_at>?")
    .bind(user.id, since)
    .first<any>()
    .catch(() => null);
  if (Number(recent?.n ?? 0) >= 6) return status(context.env, user.id);
  await db
    .prepare("INSERT INTO audit_log (id, user_id, action, meta_json, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(`audit-${crypto.randomUUID()}`, user.id, "billing_sync", "{}", now())
    .run()
    .catch(() => null);

  const body = (await context.request.json().catch(() => ({}))) as { sessionId?: unknown };
  const sessionId = typeof body.sessionId === "string" && /^cs_[A-Za-z0-9_]{10,200}$/.test(body.sessionId) ? body.sessionId : "";
  const ownsSession = (s: any) => String(s?.client_reference_id ?? s?.metadata?.user_id ?? "") === user.id;

  // 1. The session Stripe just returned from.
  if (sessionId) {
    const session = await stripeGet(context.env, `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
    if (session && isOurCheckout(session) && ownsSession(session)) {
      const linked = await activateFromCheckout(context.env, { ...session, client_reference_id: user.id });
      if (linked) return status(context.env, user.id);
    }
  }

  // 2. A known Stripe customer: read their subscriptions directly.
  const row = await db.prepare("SELECT stripe_customer_id FROM subscriptions WHERE user_id=? LIMIT 1").bind(user.id).first<any>();
  const customerId = row?.stripe_customer_id as string | undefined;
  if (customerId) {
    const subs = await stripeGet(context.env, `/v1/subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=10`);
    const list = ((subs?.data ?? []) as any[]).filter((s) => isPremiumSubscription(context.env, s));
    const best =
      list.find((s) => normalizeStatus(s.status) === "active") ??
      list.sort((a, b) => Number(b.created ?? 0) - Number(a.created ?? 0))[0];
    if (best) {
      await upsertSubscription(db, user.id, {
        customerId,
        subscriptionId: best.id,
        status: normalizeStatus(best.status),
        periodEnd: periodEndMs(best),
      });
      return status(context.env, user.id);
    }
  }

  // 3. Premium Payment Link checkouts made with this account.
  const sessions = await stripeGet(
    context.env,
    `/v1/checkout/sessions?payment_link=${PREMIUM_PAYMENT_LINK_ID}&status=complete&limit=50`,
  );
  const match = ((sessions?.data ?? []) as any[]).find(ownsSession);
  if (match) await activateFromCheckout(context.env, { ...match, client_reference_id: user.id });

  return status(context.env, user.id);
}

async function status(env: Env, userId: string) {
  const ts = now();
  const row = await env.DB.prepare("SELECT status, current_period_end FROM subscriptions WHERE user_id=? LIMIT 1").bind(userId).first<any>();
  const end = Number(row?.current_period_end ?? 0);
  const premium = row?.status === "active" && (!end || end > ts);
  return json({ ok: true, premium, status: row?.status ?? "inactive", currentPeriodEnd: end });
}
