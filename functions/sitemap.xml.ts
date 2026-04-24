import type { Env } from "./api/_lib";

function xmlEscape(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function onRequestGet(context: { env: Env }) {
  const origin = String(context.env.APP_ORIGIN ?? "https://referrals.live").replace(/\/+$/, "");
  const rows = await context.env.DB.prepare("SELECT slug, published_at FROM blog_posts ORDER BY published_at DESC LIMIT 500").all<any>();
  const posts = rows.results ?? [];

  const staticPaths = ["/", "/browse", "/categories", "/leaderboard", "/blog", "/premium", "/submit", "/about", "/contact", "/privacy", "/terms", "/disclosure", "/disclaimer"];
  const urls = [
    ...staticPaths.map((p) => ({ loc: `${origin}${p}`, lastmod: null })),
    ...posts.map((p: any) => ({
      loc: `${origin}/blog/${encodeURIComponent(String(p.slug))}`,
      lastmod: new Date(Number(p.published_at ?? Date.now())).toISOString(),
    })),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls
      .map((u) => {
        const loc = xmlEscape(u.loc);
        const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : "";
        return `<url><loc>${loc}</loc>${lastmod}</url>`;
      })
      .join("") +
    `</urlset>`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}

