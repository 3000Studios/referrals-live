-- 0022_sofi_crypto.sql
-- Owner's personal SoFi Crypto invite — added 2026-10-27 on the owner's
-- direct order. Unlike the 0019–0021 catalog rows (which point at official
-- program pages because no personal link existed yet), this row carries the
-- owner's own invite link, the same pattern as the Honey featured link.
-- Offer stated exactly as SoFi documents it to the owner: the new member
-- gets $25 in SOFID and the owner gets $50 in SOFID when the new member
-- opens a SoFi Crypto account through the link and makes a purchase of
-- $25 or more within 30 days. Terms apply. Do not inflate these figures.
-- Category: crypto (the site's crypto section). The generic SoFi referral
-- program page stays as ref-sofi under fintech — this is a distinct offer.
-- Idempotent: INSERT OR IGNORE throughout.
-- Apply with: npx wrangler d1 migrations apply referrals-live --remote

INSERT OR IGNORE INTO referrals (id, user_id, title, description, url, category, tags_json, image_url, status, created_at, updated_at)
VALUES
  ('ref-sofi-crypto', 'user-system', 'SoFi Crypto — Invite', 'The site owner''s personal SoFi Crypto invite: open a SoFi Crypto account through this link and make a purchase of $25 or more within 30 days, and you get $25 in SOFID — the owner gets $50 in SOFID. Terms apply.', 'https://www.sofi.com/invite/crypto?gcp=0d37cda8-b31f-4f4f-83ac-b3fb0ce0cb52&isAliasGcp=false&siid=1d462057-6381-4c0c-ae15-341b328c0d09', 'crypto', '["crypto","exchange","invite"]', 'https://www.google.com/s2/favicons?domain=sofi.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000);

INSERT OR IGNORE INTO referral_metrics (referral_id, votes, clicks)
VALUES
  ('ref-sofi-crypto', 0, 0);
