import type { Env } from "../_lib";
import { json } from "../_lib";
import { requireUser } from "../_session";

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
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const priceId = context.env.STRIPE_PRICE_ID;
  if (!priceId) return json({ ok: false, error: "Billing not configured" }, { status: 503 });

  const origin = new URL(context.request.url).origin;
  const appOrigin = context.env.APP_ORIGIN || origin;

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

  const session = await stripePost(context.env, "/v1/checkout/sessions", {
    mode: "subscription",
    customer: customerId,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: `${appOrigin}/dashboard?billing=success`,
    cancel_url: `${appOrigin}/premium?billing=cancel`,
    client_reference_id: user.id,
    "metadata[user_id]": user.id,
    "subscription_data[metadata][user_id]": user.id,
  });

  return json({ ok: true, url: session.url });
}
