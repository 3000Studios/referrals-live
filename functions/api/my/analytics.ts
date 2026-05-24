import type { Env } from "../_lib";
import { json } from "../_lib";
import { requireUser } from "../_session";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const user = await requireUser(context.request, context.env);
  if (!user) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    // Get user's leaderboard rank & stats
    const lbRow = await context.env.DB.prepare(
      `SELECT rank, badge, total_clicks, total_earnings_cents, total_referrals_submitted, avg_clicks_per_referral
       FROM creator_leaderboard WHERE user_id = ? LIMIT 1`
    )
      .bind(user.id)
      .first<any>();

    // Get referral-level analytics
    const analyticsRows = await context.env.DB.prepare(
      `SELECT
        ra.referral_id, r.title, r.category,
        ra.clicks_today, ra.clicks_week, ra.clicks_month,
        ra.earnings_cents_today, ra.earnings_cents_week, ra.earnings_cents_month,
        ra.conversion_rate
      FROM referral_analytics ra
      JOIN referrals r ON r.id = ra.referral_id
      WHERE ra.user_id = ?
      ORDER BY ra.clicks_month DESC
      LIMIT 50`
    )
      .bind(user.id)
      .all<any>();

    // Get badges
    const badgesRows = await context.env.DB.prepare(
      `SELECT badge_type, earned_at FROM creator_badges WHERE user_id = ? ORDER BY earned_at DESC`
    )
      .bind(user.id)
      .all<any>();

    // Get earned rewards
    const rewardsRows = await context.env.DB.prepare(
      `SELECT id, referral_program_id, referrer_bonus_cents, reason, status, earned_at
       FROM rewards WHERE referrer_id = ? AND status IN ('earned', 'paid')
       ORDER BY earned_at DESC LIMIT 20`
    )
      .bind(user.id)
      .all<any>();

    // Get earnings history for chart
    const historyRows = await context.env.DB.prepare(
      `SELECT period_date, clicks, earnings_cents
       FROM earnings_history WHERE user_id = ? AND period = 'daily'
       ORDER BY period_date DESC LIMIT 30`
    )
      .bind(user.id)
      .all<any>();

    return json({
      ok: true,
      leaderboard: {
        rank: lbRow?.rank ?? null,
        badge: lbRow?.badge ?? "bronze",
        totalClicks: lbRow?.total_clicks ?? 0,
        totalEarnings: (lbRow?.total_earnings_cents ?? 0) / 100,
        totalSubmitted: lbRow?.total_referrals_submitted ?? 0,
        avgClicksPerReferral: lbRow?.avg_clicks_per_referral ?? 0,
      },
      referrals: (analyticsRows.results ?? []).map((r: any) => ({
        id: r.referral_id,
        title: r.title,
        category: r.category,
        clicksToday: r.clicks_today,
        clicksWeek: r.clicks_week,
        clicksMonth: r.clicks_month,
        earningsToday: r.earnings_cents_today / 100,
        earningsWeek: r.earnings_cents_week / 100,
        earningsMonth: r.earnings_cents_month / 100,
        conversionRate: r.conversion_rate,
      })),
      badges: (badgesRows.results ?? []).map((b: any) => ({
        type: b.badge_type,
        earnedAt: b.earned_at,
      })),
      earnedRewards: (rewardsRows.results ?? []).map((r: any) => ({
        id: r.id,
        bonus: r.referrer_bonus_cents / 100,
        reason: r.reason,
        status: r.status,
        earnedAt: r.earned_at,
      })),
      earningsHistory: (historyRows.results ?? []).map((h: any) => ({
        date: h.period_date,
        clicks: h.clicks,
        earnings: h.earnings_cents / 100,
      })),
    });
  } catch (e) {
    console.error("Analytics error:", e);
    return json({ ok: false, error: String(e) }, { status: 500 });
  }
}
