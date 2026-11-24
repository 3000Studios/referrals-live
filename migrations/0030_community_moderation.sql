-- Community moderation (2026-11-24).
-- listing_reports: one report per reporter per listing. Three distinct
-- reports on a member listing set referrals.terms_flagged=1, which pulls it
-- from the member boxes, Top Spots and /go until an admin restores it.
CREATE TABLE IF NOT EXISTS listing_reports (
  id TEXT PRIMARY KEY,
  referral_id TEXT NOT NULL,
  reporter_key TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (referral_id, reporter_key)
);
CREATE INDEX IF NOT EXISTS idx_listing_reports_referral ON listing_reports (referral_id);

-- moderation_log: what the automated checks and admins decided, and why.
CREATE TABLE IF NOT EXISTS moderation_log (
  id TEXT PRIMARY KEY,
  referral_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_moderation_log_referral ON moderation_log (referral_id);

CREATE INDEX IF NOT EXISTS idx_referrals_user_created ON referrals (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_featured_slots_ends ON featured_slots (ends_at);
