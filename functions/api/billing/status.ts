import type { Env } from "../_lib";
import { json, now } from "../_lib";
import { requireUser } from "../_session";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const ts = now();
  const row = await context.env.DB.prepare(
    "SELECT stripe_customer_id, stripe_sub_id, status, current_period_end FROM subscriptions WHERE user_id=? LIMIT 1",
  )
    .bind(user.id)
    .first<any>();

  return json({
    ok: true,
    billing: {
      premium: user.premium,
      stripeCustomerId: row?.stripe_customer_id ?? null,
      stripeSubscriptionId: row?.stripe_sub_id ?? null,
      status: row?.status ?? "inactive",
      currentPeriodEnd: Number(row?.current_period_end ?? 0),
      activeUntil: Number(row?.current_period_end ?? 0) > ts ? Number(row?.current_period_end ?? 0) : 0,
    },
  });
}
