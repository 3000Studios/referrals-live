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
  ('ref-dropbox', 'user-system', 'Dropbox — Referral Program', 'Invite friends to Dropbox and earn extra space. Official referral program page.', 'https://www.dropbox.com/referrals', 'saas', '["storage","referrals","productivity"]', 'https://images.unsplash.com/photo-1527430253228-e93688616381?auto=format&fit=crop&w=1200&q=80', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-revolut', 'user-system', 'Revolut — Referrals Terms', 'Revolut referral program terms and eligibility. Use this to understand current referral rules.', 'https://www.revolut.com/legal/referrals/', 'fintech', '["fintech","banking","referrals"]', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-wise', 'user-system', 'Wise — Invite Friends Help', 'How Wise friend invites work. Great for audiences doing international transfers.', 'https://wise.com/help/articles/2978044/invite-friends-to-wise', 'fintech', '["money","international","invite"]', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-coinbase', 'user-system', 'Coinbase — Invite Friends', 'Coinbase invite friends overview and rules (official help center).', 'https://help.coinbase.com/en/coinbase/getting-started/other/invite-friends', 'crypto', '["crypto","exchange","invite"]', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-uberaff', 'user-system', 'Uber — Affiliate Program', 'Affiliate program info for driving signups and rides (official).', 'https://www.uber.com/us/en/affiliate/', 'travel', '["affiliate","rideshare","marketing"]', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-shopify', 'user-system', 'Shopify — Affiliate Program', 'Promote Shopify and earn commissions (official affiliate program page).', 'https://www.shopify.com/affiliates', 'ecommerce', '["ecommerce","affiliate","saas"]', 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1200&q=80', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-amazon-assoc', 'user-system', 'Amazon Associates — Affiliate Program', 'Earn by recommending products. Official Amazon Associates program page.', 'https://affiliate-program.amazon.com/', 'ecommerce', '["affiliate","products","creator"]', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000);

INSERT OR IGNORE INTO referral_metrics (referral_id, votes, clicks)
VALUES
  ('ref-dropbox', 120, 520),
  ('ref-revolut', 98, 410),
  ('ref-wise', 110, 460),
  ('ref-coinbase', 140, 680),
  ('ref-uberaff', 70, 300),
  ('ref-shopify', 160, 740),
  ('ref-amazon-assoc', 155, 710);
