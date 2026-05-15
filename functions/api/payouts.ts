import type { Env } from "./_lib";
import { json } from "./_lib";

export async function onRequestGet(context: { env: Env }) {
  const db = context.env.DB;

  try {
    const payouts = await db
      .prepare("SELECT amount_cents, user_obfuscated_id FROM payout_logs WHERE status = 'paid' ORDER BY created_at DESC LIMIT 5")
      .all<any>();

    if (!payouts.results || payouts.results.length === 0) {
      return json([]);
    }

    return json(payouts.results);
  } catch (err) {
    return json([]);
  }
}
