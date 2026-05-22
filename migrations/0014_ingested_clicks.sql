-- Track click-through on auto-discovered offers so the admin dashboard can
-- show owner attribution performance for the ingested feed.
ALTER TABLE ingested_offers ADD COLUMN click_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ingested_offers ADD COLUMN last_click_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_ingested_offers_click_count ON ingested_offers(click_count DESC);
