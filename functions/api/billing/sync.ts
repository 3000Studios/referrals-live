import type { Env } from "../_lib";
import { json, now } from "../_lib";
import { requireUser } from "../_session";
import {
  PREMIUM_PAYMENT_LINK_ID,
  PREMIUM_PRICE_ID,
  activateFromCheckout,
  isOurCheckout,
  normalizeStatus,
  periodEndMs,
  stripeGet,
  upsertSubscription,
} from "./webhook";

/**
 * Re-checks Stripe for the signed-in member's Premium subscription and
 * updates their access. Runs after checkout returns, so access never
 * depends on the webhook arriving first, and links Payment Link checkouts
 * that were paid with the member's account email.
 */
export async function onRequestPost(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!context.env.STRIPE_SECRET_KEY) return json({ ok: false, error: "Billing not configured" }, { status: 503 });

  const db = context.env.DB;
  const body = (await context.request.json().catch(() => ({}))) as { sessionId?: unknown };
  const sessionId = typeof body.sessionId === "string" && /^cs_[A-Za-z0-9_]{10,200}$/.test(body.sessionId) ? body.sessionId : "";
  const email = user.email.trim().toLowerCase();

  const ownsSession = (s: any) => {
    const ref = String(s?.client_reference_id ?? s?.metadata?.user_id ?? "");
    if (ref) return ref === user.id;
    const payer = String(s?.customer_details?.email ?? s?.customer_email ?? "").trim().toLowerCase();
    return Boolean(payer) && payer === email;
  };

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
    const prices = new Set([PREMIUM_PRICE_ID, context.env.STRIPE_PRICE_ID].filter(Boolean));
    const list = ((subs?.data ?? []) as any[]).filter(
      (s) =>
        s?.metadata?.site === "referrals.live" ||
        String(s?.metadata?.user_id ?? "") === user.id ||
        ((s?.items?.data ?? []) as any[]).some((it) => prices.has(it?.price?.id)),
    );
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
