import type { Env } from "./_lib";
import { json } from "./_lib";

export async function onRequestGet(context: { env: Env }) {
  const db = context.env.DB;

  try {
    const payouts = await db
      .prepare("SELECT amount_cents, user_obfuscated_id FROM payout_logs WHERE status = 'paid' ORDER BY created_at DESC LIMIT 5")
      .all<any>();

    // If no real payouts yet, return some seeded/mock data to keep the ticker alive
    if (!payouts.results || payouts.results.length === 0) {
      const mockPayouts = [
        { amount_cents: 45000, user_obfuscated_id: "User_8421" },
        { amount_cents: 12500, user_obfuscated_id: "User_1102" },
        { amount_cents: 89000, user_obfuscated_id: "User_5593" },
        { amount_cents: 33000, user_obfuscated_id: "User_2109" },
        { amount_cents: 15000, user_obfuscated_id: "User_7721" },
      ];
      return json(mockPayouts);
    }

    return json(payouts.results);
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
}
