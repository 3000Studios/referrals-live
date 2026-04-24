-- Blog posts for SEO automation
-- Apply with: npx wrangler d1 migrations apply referrals-live --remote

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content_md TEXT NOT NULL,
  keywords_json TEXT NOT NULL,
  hero_video_src TEXT,
  hero_video_label TEXT,
  hero_video_attribution_label TEXT,
  hero_video_attribution_href TEXT,
  published_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);

