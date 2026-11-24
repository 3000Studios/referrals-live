import type { Env } from "../_lib";
import { json, safeOrigin } from "../_lib";
import { requireUser } from "../_session";
import { PREMIUM_PRICE_ID } from "./webhook";

function formEncode(body: Record<string, string>) {
  return Object.entries(body)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

async function stripePost(env: Env, path: string, body: Record<string, string>) {
  if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured.");
  const res = await fetch(`https://api.stripe.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formEncode(body),
  });
  const data = (await res.json().catch(() => null)) as any;
  if (!res.ok) throw new Error(data?.error?.message ?? "Stripe request failed.");
  return data;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const user = await requireUser(context.request, context.env);
    if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (user.premium) return json({ ok: true, alreadyPremium: true, url: "/dashboard" });
    if (!context.env.STRIPE_SECRET_KEY) return json({ ok: false, error: "Billing not configured" }, { status: 503 });
    // The live Premium price ($3.99/mo) unless an override is configured.
    const priceId = context.env.STRIPE_PRICE_ID || PREMIUM_PRICE_ID;

    const origin = new URL(context.request.url).origin;
    const appOrigin = safeOrigin(context.env, origin);

    const db = context.env.DB;
    const sub = await db.prepare("SELECT stripe_customer_id FROM subscriptions WHERE user_id=? LIMIT 1").bind(user.id).first<any>();
    let customerId = sub?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripePost(context.env, "/v1/customers", { email: user.email, name: user.displayName });
      customerId = customer.id;
      await db
        .prepare(
          "INSERT OR REPLACE INTO subscriptions (user_id, stripe_customer_id, stripe_sub_id, status, current_period_end) VALUES (?, ?, COALESCE((SELECT stripe_sub_id FROM subscriptions WHERE user_id=?), NULL), COALESCE((SELECT status FROM subscriptions WHERE user_id=?), 'inactive'), COALESCE((SELECT current_period_end FROM subscriptions WHERE user_id=?), 0))",
        )
        .bind(customerId ? user.id : user.id, customerId, user.id, user.id, user.id)
        .run();
    }

    if (!customerId) throw new Error("Stripe customer was not provisioned.");

    const session = await stripePost(context.env, "/v1/checkout/sessions", {
      mode: "subscription",
      customer: customerId,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: `${appOrigin}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appOrigin}/premium?billing=cancel`,
      client_reference_id: user.id,
      "metadata[user_id]": user.id,
      "subscription_data[metadata][user_id]": user.id,
      "metadata[site]": "referrals.live",
      "subscription_data[metadata][site]": "referrals.live",
      allow_promotion_codes: "true",
    });

    return json({ ok: true, url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to start checkout.";
    return json({ ok: false, error: message }, { status: 503 });
  }
}
