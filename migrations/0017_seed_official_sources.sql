-- Begin monitoring the existing hand-curated official program pages immediately.
INSERT OR IGNORE INTO ingest_sources
  (id, offer_id, source_name, source_url, enabled, created_at, updated_at)
SELECT
  'source-' || id,
  id,
  title,
  url,
  1,
  created_at,
  updated_at
FROM ingested_offers
WHERE source = 'curated';
