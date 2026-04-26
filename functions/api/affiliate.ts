import { Env, json, now } from "./_lib";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const db = context.env.DB;
  
  // 1. Get user session (mocked for this demo, usually from session cookie)
  // In a real app, you'd verify the JWT/Session here.
  const userId = "user-123"; // Replace with real auth

  try {
    // 2. Fetch Stats
    const stats = await db.prepare(
      "SELECT * FROM affiliate_stats WHERE user_id = ?"
    ).bind(userId).first<any>();

    // 3. Fetch Recent Transactions
    const transactions = await db.prepare(
      "SELECT * FROM conversions WHERE referrer_id = ? ORDER BY created_at DESC LIMIT 10"
    ).bind(userId).all<any>();

    return json({
      referralCode: stats?.referral_code || "OFFER20",
      stats: {
        clicks: stats?.total_clicks || 0,
        referrals: stats?.total_conversions || 0,
        balance: stats?.balance_cents || 0
      },
      transactions: transactions.results
    });
  } catch (err: any) {
    return json({ error: err.message }, { status: 500 });
  }
}
