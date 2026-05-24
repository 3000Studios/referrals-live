import type { Env } from "./_lib";
import { json } from "./_lib";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
  const offset = Math.min(Number(url.searchParams.get("offset") ?? "0"), 10000);

  try {
    const rows = await context.env.DB.prepare(
      `SELECT
        u.id, u.display_name, u.avatar, u.color,
        cl.rank, cl.badge, cl.total_clicks, cl.total_earnings_cents,
        cl.total_referrals_submitted, cl.avg_clicks_per_referral,
        COUNT(DISTINCT cb.badge_type) as badge_count
      FROM creator_leaderboard cl
      JOIN users u ON u.id = cl.user_id
      LEFT JOIN creator_badges cb ON cb.user_id = cl.user_id
      ORDER BY cl.rank ASC, cl.total_earnings_cents DESC
      LIMIT ? OFFSET ?`
    )
      .bind(limit, offset)
      .all<any>();

    const creators = (rows.results ?? []).map((r: any) => ({
      id: r.id,
      displayName: r.display_name,
      avatar: r.avatar,
      color: r.color,
      rank: r.rank,
      badge: r.badge,
      totalClicks: r.total_clicks,
      totalEarnings: r.total_earnings_cents / 100,
      totalSubmitted: r.total_referrals_submitted,
      avgClicksPerReferral: r.avg_clicks_per_referral,
      badgeCount: r.badge_count,
    }));

    return json({ ok: true, creators, offset, limit });
  } catch (e) {
    console.error("Leaderboard error:", e);
    return json({ ok: false, error: String(e) }, { status: 500 });
  }
}
