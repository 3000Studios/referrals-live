import type { Env } from "../_lib";
import { json } from "../_lib";
import { requireUser } from "../_session";

async function requireAdmin(request: Request, env: Env) {
  const user = await requireUser(request, env);
  if (!user) return { error: json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  if (!user.isAdmin) return { error: json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  return { user };
}

function domainOf(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const gate = await requireAdmin(context.request, context.env);
  if ("error" in gate) return gate.error;

  const db = context.env.DB;

  const [curatedTop, ingestedTop, totals, recentAffiliate] = await Promise.all([
    db
      .prepare(
        `SELECT r.id, r.title, r.url, m.clicks, m.last_click_at, m.votes
         FROM referrals r
         LEFT JOIN referral_metrics m ON m.referral_id=r.id
         WHERE COALESCE(m.clicks, 0) > 0
         ORDER BY m.clicks DESC, m.last_click_at DESC
         LIMIT 12`,
      )
      .all<any>(),
    db
      .prepare(
        `SELECT id, title, url, click_count AS clicks, last_click_at, source
         FROM ingested_offers
         WHERE COALESCE(click_count, 0) > 0
         ORDER BY click_count DESC, last_click_at DESC
         LIMIT 12`,
      )
      .all<any>(),
    db
      .prepare(
        `SELECT
           (SELECT COALESCE(SUM(clicks),0) FROM referral_metrics) AS curated_clicks,
           (SELECT COALESCE(SUM(click_count),0) FROM ingested_offers) AS ingested_clicks,
           (SELECT COUNT(*) FROM click_logs) AS affiliate_clicks,
           (SELECT COUNT(*) FROM owner_attribution) AS attribution_domains`,
      )
      .first<any>(),
    db
      .prepare(
        `SELECT cl.code, cl.user_agent, cl.created_at, ast.user_id
         FROM click_logs cl
         LEFT JOIN affiliate_stats ast ON ast.referral_code=cl.code
         ORDER BY cl.created_at DESC
         LIMIT 25`,
      )
      .all<any>(),
  ]);

  type Row = {
    id: string;
    title: string;
    url: string;
    domain: string;
    clicks: number;
    lastClickAt: number;
    source: string;
    attributed: boolean;
  };

  // Attribution lookup: for each row's domain, do we have an entry in owner_attribution?
  const allRows = [
    ...(curatedTop.results ?? []).map((r: any) => ({
      id: String(r.id),
      title: String(r.title ?? ""),
      url: String(r.url ?? ""),
      clicks: Number(r.clicks ?? 0),
      lastClickAt: Number(r.last_click_at ?? 0),
      source: "curated",
    })),
    ...(ingestedTop.results ?? []).map((r: any) => ({
      id: String(r.id),
      title: String(r.title ?? ""),
      url: String(r.url ?? ""),
      clicks: Number(r.clicks ?? 0),
      lastClickAt: Number(r.last_click_at ?? 0),
      source: String(r.source ?? "ingested"),
    })),
  ];

  const uniqueDomains = Array.from(new Set(allRows.map((r) => domainOf(r.url)).filter(Boolean)));
  const configured = new Set<string>();
  if (uniqueDomains.length) {
    const placeholders = uniqueDomains.map(() => "?").join(",");
    const attrRows = await db
      .prepare(`SELECT domain FROM owner_attribution WHERE domain IN (${placeholders})`)
      .bind(...uniqueDomains)
      .all<any>();
    (attrRows.results ?? []).forEach((row: any) => configured.add(String(row.domain)));
  }

  const enriched: Row[] = allRows
    .map((r) => ({ ...r, domain: domainOf(r.url), attributed: configured.has(domainOf(r.url)) }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20);

  return json({
    ok: true,
    totals: {
      curatedClicks: Number(totals?.curated_clicks ?? 0),
      ingestedClicks: Number(totals?.ingested_clicks ?? 0),
      affiliateClicks: Number(totals?.affiliate_clicks ?? 0),
      attributionDomains: Number(totals?.attribution_domains ?? 0),
    },
    topLinks: enriched,
    recentAffiliateClicks: (recentAffiliate.results ?? []).map((r: any) => ({
      code: String(r.code ?? ""),
      userId: r.user_id ? String(r.user_id) : null,
      userAgent: String(r.user_agent ?? "").slice(0, 80),
      createdAt: Number(r.created_at ?? 0),
    })),
  });
}
