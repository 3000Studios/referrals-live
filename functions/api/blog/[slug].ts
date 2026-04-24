import type { Env } from "../_lib";
import { json } from "../_lib";

export async function onRequestGet(context: { env: Env; params: { slug?: string } }) {
  const slug = String(context.params.slug ?? "").trim();
  if (!slug) return json({ ok: false, error: "Missing slug" }, 400);

  const row = await context.env.DB.prepare(
    `SELECT slug, title, excerpt, content_md, keywords_json, hero_video_src, hero_video_label, hero_video_attribution_label, hero_video_attribution_href, published_at
     FROM blog_posts
     WHERE slug=?
     LIMIT 1`,
  )
    .bind(slug)
    .first<any>();

  if (!row) return json({ ok: false, error: "Not found" }, 404);

  const post = {
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt),
    contentMd: String(row.content_md),
    keywords: JSON.parse(row.keywords_json ?? "[]"),
    video: row.hero_video_src
      ? {
          src: String(row.hero_video_src),
          label: String(row.hero_video_label ?? "Auto-play video"),
          attributionLabel: String(row.hero_video_attribution_label ?? "Video source"),
          attributionHref: String(row.hero_video_attribution_href ?? "#"),
        }
      : null,
    publishedAt: Number(row.published_at),
  };

  return json({ ok: true, post });
}

