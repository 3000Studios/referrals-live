-- 0025_remove_sofi_coinbase.sql
-- Owner decision 2026-10-28: pull the SoFi and Coinbase program pages
-- ENTIRELY from referrals.live. Standing ruling M49: SoFi + Coinbase are
-- PRIVATE — the owner's own referral links live only in HELD-LINKS.md
-- (repo root, unpublished) and no public listing of either program may
-- exist on the site. Both programs were publicly listed (status='public')
-- with generic program-page URLs; this migration deletes the listings and
-- every per-program row that would surface them.
--
-- Mirrors the removals in scripts/catalog.json (sitemap + prerender
-- source) and workers/ingest.ts (curated ingest seed) made the same day.
-- HELD-LINKS.md is deliberately untouched.

DELETE FROM featured_slots WHERE referral_id IN ('ref-sofi', 'ref-coinbase');
DELETE FROM referral_metrics WHERE referral_id IN ('ref-sofi', 'ref-coinbase');
DELETE FROM ingested_offers WHERE id IN ('ref-sofi', 'ref-coinbase');
DELETE FROM referrals WHERE id IN ('ref-sofi', 'ref-coinbase');
