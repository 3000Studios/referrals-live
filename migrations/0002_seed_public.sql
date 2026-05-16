PRAGMA foreign_keys = ON;

-- Seed a system user for curated public listings (real, non-personal referral/affiliate program pages).
INSERT OR IGNORE INTO users (id, email, display_name, password_hash, created_at)
VALUES ('user-system', 'curation@referrals.live', 'Referrals.live Curation', 'pbkdf2$sha256$$210000$$AAAAAAAAAAAAAAAAAAAAAA==$$AAAAAAAAAAAAAAAAAAAAAA==', strftime('%s','now')*1000);

INSERT OR REPLACE INTO subscriptions (user_id, status, current_period_end)
VALUES ('user-system', 'active', NULL);

-- Public referral/affiliate program landing pages (no personal codes).
-- NOTE: Keep these URLs pointing to official program pages to remain AdSense/SEO safe.
INSERT OR IGNORE INTO referrals (id, user_id, title, description, url, category, tags_json, image_url, status, created_at, updated_at)
VALUES
  ('ref-dropbox', 'user-system', 'Dropbox — Referral Program', 'Invite friends to Dropbox and earn extra space. Official referral program page.', 'https://www.dropbox.com/referrals', 'saas', '["storage","referrals","productivity"]', 'https://cdn.simpleicons.org/dropbox/0061FF', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-revolut', 'user-system', 'Revolut — Referrals Terms', 'Revolut referral program terms and eligibility. Use this to understand current referral rules.', 'https://www.revolut.com/legal/referrals/', 'fintech', '["fintech","banking","referrals"]', 'https://cdn.simpleicons.org/revolut/0075EB', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-wise', 'user-system', 'Wise — Invite Friends Help', 'How Wise friend invites work. Great for audiences doing international transfers.', 'https://wise.com/help/articles/2978044/invite-friends-to-wise', 'fintech', '["money","international","invite"]', 'https://cdn.simpleicons.org/wise/9FE870', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-coinbase', 'user-system', 'Coinbase — Invite Friends', 'Coinbase invite friends overview and rules (official help center).', 'https://help.coinbase.com/en/coinbase/getting-started/other/invite-friends', 'crypto', '["crypto","exchange","invite"]', 'https://cdn.simpleicons.org/coinbase/0052FF', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-uberaff', 'user-system', 'Uber — Affiliate Program', 'Affiliate program info for driving signups and rides (official).', 'https://www.uber.com/us/en/affiliate/', 'travel', '["affiliate","rideshare","marketing"]', 'https://cdn.simpleicons.org/uber/FFFFFF', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-shopify', 'user-system', 'Shopify — Affiliate Program', 'Promote Shopify and earn commissions (official affiliate program page).', 'https://www.shopify.com/affiliates', 'ecommerce', '["ecommerce","affiliate","saas"]', 'https://cdn.simpleicons.org/shopify/7AB55C', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-amazon-assoc', 'user-system', 'Amazon Associates — Affiliate Program', 'Earn by recommending products. Official Amazon Associates program page.', 'https://affiliate-program.amazon.com/', 'ecommerce', '["affiliate","products","creator"]', 'https://www.google.com/s2/favicons?domain=amazon.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000);

INSERT OR IGNORE INTO referral_metrics (referral_id, votes, clicks)
VALUES
  ('ref-dropbox', 0, 0),
  ('ref-revolut', 0, 0),
  ('ref-wise', 0, 0),
  ('ref-coinbase', 0, 0),
  ('ref-uberaff', 0, 0),
  ('ref-shopify', 0, 0),
  ('ref-amazon-assoc', 0, 0);
