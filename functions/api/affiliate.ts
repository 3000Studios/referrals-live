import { Env, json } from "./_lib";
import { requireUser } from "./_session";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const db = context.env.DB;
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const stats = await db.prepare(
      "SELECT * FROM affiliate_stats WHERE user_id = ?"
    ).bind(user.id).first<any>();

    const transactions = await db.prepare(
      "SELECT * FROM conversions WHERE referrer_id = ? ORDER BY created_at DESC LIMIT 10"
    ).bind(user.id).all<any>();

    return json({
      referralCode: stats?.referral_code || "",
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
