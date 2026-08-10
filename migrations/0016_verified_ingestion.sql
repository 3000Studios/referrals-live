-- Verified ingestion: public offers must have a review state and a traceable source.
ALTER TABLE ingested_offers ADD COLUMN review_status TEXT NOT NULL DEFAULT 'review_required';
ALTER TABLE ingested_offers ADD COLUMN verified_at INTEGER;

CREATE TABLE IF NOT EXISTS ingest_sources (
  id TEXT PRIMARY KEY,
  offer_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_checked_at INTEGER,
  last_http_status INTEGER,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (offer_id) REFERENCES ingested_offers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ingested_offers_review_status ON ingested_offers(review_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingest_sources_enabled ON ingest_sources(enabled, updated_at DESC);

UPDATE ingested_offers
SET review_status = CASE WHEN source = 'curated' THEN 'approved' ELSE 'review_required' END
WHERE review_status = 'review_required';
