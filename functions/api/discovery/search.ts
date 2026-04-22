import type { Env } from "../_lib";
import { json } from "../_lib";

function scoreTextMatch(text: string, query: string) {
  if (!query) return 0;
  const value = text.toLowerCase();
  const q = query.toLowerCase();
  if (value === q) return 8;
  if (value.startsWith(q)) return 5;
  if (value.includes(q)) return 3;
  return 0;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const cat = url.searchParams.get("cat")?.trim().toLowerCase() ?? "all";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "60"), 120);

  const [publicRows, ingestedRows] = await Promise.all([
    context.env.DB.prepare(
      `SELECT r.id, r.title, r.description, r.url, r.category, r.tags_json, r.image_url, r.created_at, COALESCE(m.votes,0) AS votes, COALESCE(m.clicks,0) AS clicks
       FROM referrals r
       LEFT JOIN referral_metrics m ON m.referral_id=r.id
       WHERE r.status='public'
       ORDER BY r.created_at DESC
       LIMIT 200`,
    ).all<any>(),
    context.env.DB.prepare(
      `SELECT id, title, description, url, category, tags_json, image_url, created_at, score
       FROM ingested_offers
       ORDER BY score DESC, updated_at DESC
       LIMIT 200`,
    ).all<any>(),
  ]);

  const merged = [
    ...(publicRows.results ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      url: row.url,
      category: row.category,
      tags: JSON.parse(row.tags_json ?? "[]"),
      image: row.image_url,
      votes: Number(row.votes ?? 0),
      clicks: Number(row.clicks ?? 0),
      createdAt: Number(row.created_at ?? 0),
      source: "member",
      rawScore: Number(row.clicks ?? 0) + Number(row.votes ?? 0) * 2,
    })),
    ...(ingestedRows.results ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      url: row.url,
      category: row.category,
      tags: JSON.parse(row.tags_json ?? "[]"),
      image: row.image_url,
      votes: 0,
      clicks: 0,
      createdAt: Number(row.created_at ?? 0),
      source: "discovery",
      rawScore: Number(row.score ?? 0),
    })),
  ];

  const filtered = merged
    .filter((item) => cat === "all" || item.category.toLowerCase() === cat)
    .map((item) => {
      const haystack = `${item.title} ${item.description} ${item.tags.join(" ")}`;
      const textBoost = q ? scoreTextMatch(item.title, q) + scoreTextMatch(haystack, q) : 1;
      return { ...item, rank: item.rawScore + textBoost * 10 };
    })
    .filter((item) => !q || item.rank > item.rawScore)
    .sort((a, b) => b.rank - a.rank || b.createdAt - a.createdAt)
    .slice(0, limit);

  return json({ ok: true, results: filtered });
}
