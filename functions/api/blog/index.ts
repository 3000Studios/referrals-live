import type { Env } from "../_lib";
import { json } from "../_lib";

export async function onRequestGet(context: { env: Env }) {
  const rows = await context.env.DB.prepare(
    `SELECT slug, title, excerpt, keywords_json, hero_video_src, hero_video_label, hero_video_attribution_label, hero_video_attribution_href, published_at
     FROM blog_posts
     ORDER BY published_at DESC
     LIMIT 200`,
  ).all<any>();

  const posts = (rows.results ?? []).map((r: any) => ({
    slug: String(r.slug),
    title: String(r.title),
    excerpt: String(r.excerpt),
    keywords: JSON.parse(r.keywords_json ?? "[]"),
    video: r.hero_video_src
      ? {
          src: String(r.hero_video_src),
          label: String(r.hero_video_label ?? "Auto-play video"),
          attributionLabel: String(r.hero_video_attribution_label ?? "Video source"),
          attributionHref: String(r.hero_video_attribution_href ?? "#"),
        }
      : null,
    publishedAt: Number(r.published_at),
  }));

  return json({ ok: true, posts });
}

