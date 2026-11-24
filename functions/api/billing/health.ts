import type { Env } from "../_lib";
import { json } from "../_lib";

/** Public, booleans only: which parts of billing are switched on. */
export async function onRequestGet(context: { env: Env }) {
  const env = context.env;
  return json(
    {
      ok: true,
      stripe: {
        apiKey: Boolean(env.STRIPE_SECRET_KEY),
        webhookSecret: Boolean(env.STRIPE_WEBHOOK_SECRET),
        priceOverride: Boolean(env.STRIPE_PRICE_ID),
      },
      chat: Boolean((env as any).CHAT),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
