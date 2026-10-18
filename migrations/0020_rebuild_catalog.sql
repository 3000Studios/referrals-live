-- 0020_rebuild_catalog.sql
-- REBUILD 2026-10-18. Production drift repair + Honey.
--
-- Why this exists: the live /api/referrals served only 7 public offers
-- while the repo catalog (0002 + 0019) defines 35. The 0019 migration
-- never landed in production D1, and several live rows had drifted to
-- URLs that match no migration (including a Dropbox URL carrying a
-- personal-style code — personal attribution belongs in the
-- owner_attribution table applied by /go at click time, NOT hardcoded
-- into the catalog row). This migration is idempotent and restores one
-- source of truth:
--   A) UPDATE the original 7 seed rows to their corrected URLs
--      (0002 as amended by 0018; every URL re-verified live 2026-10-18).
--   B) INSERT OR IGNORE the full 0019 set (28 programs).
--   C) INSERT OR IGNORE Honey with the owner's personal referral link.
--   D) Metrics rows for everything above.

-- ---------- A) Original 7, corrected ----------
UPDATE referrals SET url = 'https://www.dropbox.com/referrals', title = 'Dropbox — Referral Program',
  description = 'Invite friends to Dropbox and earn extra space. Official referral program page.',
  updated_at = strftime('%s','now')*1000 WHERE id = 'ref-dropbox';
UPDATE referrals SET url = 'https://help.revolut.com/en-SG/help/referrals/other/what-are-the-requirements-to-get-my-referral-reward/', title = 'Revolut — Referral Program',
  description = 'How Revolut referrals work: invite friends and earn rewards when they sign up, add money, order a card, and make purchases (official help).',
  updated_at = strftime('%s','now')*1000 WHERE id = 'ref-revolut';
UPDATE referrals SET url = 'https://wise.com/invite', title = 'Wise — Invite Friends',
  description = 'Invite friends to Wise and earn rewards (official invite page). Great for audiences doing international transfers.',
  updated_at = strftime('%s','now')*1000 WHERE id = 'ref-wise';
UPDATE referrals SET url = 'https://www.coinbase.com/legal/international-referral', title = 'Coinbase — Invite Friends',
  description = 'Coinbase official referral program page: how to earn crypto bonuses by inviting friends.',
  updated_at = strftime('%s','now')*1000 WHERE id = 'ref-coinbase';
UPDATE referrals SET url = 'https://www.uber.com/us/en/affiliate-program/', title = 'Uber — Affiliate Program',
  description = 'Affiliate program info for driving signups and rides (official).',
  updated_at = strftime('%s','now')*1000 WHERE id = 'ref-uberaff';
-- ref-shopify and ref-amazon-assoc URLs already correct; left untouched.

-- ---------- B) The 0019 set, re-asserted ----------
INSERT OR IGNORE INTO referrals (id, user_id, title, description, url, category, tags_json, image_url, status, created_at, updated_at)
VALUES
  ('ref-sofi', 'user-system', 'SoFi — Referral Program', 'SoFi official referral program page: how inviting friends to SoFi checking, investing, and loans works.', 'https://www.sofi.com/referral-program/', 'fintech', '["fintech","banking","referrals"]', 'https://www.google.com/s2/favicons?domain=sofi.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-acorns', 'user-system', 'Acorns — Invite Friends', 'Acorns official invite page: invite friends to start investing spare change and earn rewards.', 'https://www.acorns.com/invite', 'fintech', '["fintech","investing","invite"]', 'https://www.google.com/s2/favicons?domain=acorns.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-betterment', 'user-system', 'Betterment — Friend Referral', 'Betterment official friend-referral offer page: refer friends to automated investing.', 'https://www.betterment.com/friend-referral-offer', 'fintech', '["fintech","investing","referrals"]', 'https://www.google.com/s2/favicons?domain=betterment.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-schwab', 'user-system', 'Charles Schwab — Referral Program', 'Charles Schwab official referral page: how the Schwab referral bonus program works.', 'https://www.schwab.com/referral', 'fintech', '["fintech","brokerage","referrals"]', 'https://www.google.com/s2/favicons?domain=schwab.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-gemini', 'user-system', 'Gemini — Referral Program', 'Gemini official referral program page: refer friends and earn crypto rewards.', 'https://www.gemini.com/referrals', 'crypto', '["crypto","exchange","referrals"]', 'https://www.google.com/s2/favicons?domain=gemini.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-kraken', 'user-system', 'Kraken — Referrals', 'Kraken official referrals page: invite friends to Kraken and get rewards.', 'https://www.kraken.com/referrals', 'crypto', '["crypto","exchange","invite"]', 'https://www.google.com/s2/favicons?domain=kraken.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-binanceus', 'user-system', 'Binance.US — Referral Program', 'Binance.US official referral page: refer friends and earn crypto.', 'https://www.binance.us/referral', 'crypto', '["crypto","exchange","referrals"]', 'https://cdn.simpleicons.org/binance/F0B90B', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-notion', 'user-system', 'Notion — Affiliate Program', 'Notion official affiliate program page: promote Notion and earn commissions.', 'https://www.notion.com/affiliates', 'saas', '["saas","productivity","affiliate"]', 'https://cdn.simpleicons.org/notion/FFFFFF', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-canva', 'user-system', 'Canva — Affiliate Program', 'Canva official affiliate program page (Canvassador Program): how to earn by promoting Canva.', 'https://www.canva.com/affiliates/', 'saas', '["saas","design","affiliate"]', 'https://www.google.com/s2/favicons?domain=canva.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-hostinger', 'user-system', 'Hostinger — Affiliate Program', 'Hostinger official affiliate program page: earn commissions promoting web hosting.', 'https://www.hostinger.com/affiliates', 'saas', '["saas","hosting","affiliate"]', 'https://cdn.simpleicons.org/hostinger/673DE6', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-namecheap', 'user-system', 'Namecheap — Affiliate Program', 'Namecheap official affiliate program page: earn by promoting domains and hosting.', 'https://www.namecheap.com/affiliates/', 'saas', '["saas","domains","affiliate"]', 'https://cdn.simpleicons.org/namecheap/DE3723', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-digitalocean', 'user-system', 'DigitalOcean — Referral Program', 'DigitalOcean official referral program page: refer developers and earn cloud credits/commissions.', 'https://www.digitalocean.com/referral-program', 'saas', '["saas","cloud","referrals"]', 'https://cdn.simpleicons.org/digitalocean/0080FF', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-grammarly', 'user-system', 'Grammarly — Affiliate Program', 'Grammarly official affiliates page: promote the writing assistant and earn commissions.', 'https://www.grammarly.com/affiliates', 'saas', '["saas","writing","affiliate"]', 'https://cdn.simpleicons.org/grammarly/15C39A', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-nordvpn', 'user-system', 'NordVPN — Affiliate Program', 'NordVPN official affiliate program page: join the VPN affiliate program and earn commissions.', 'https://nordvpn.com/affiliate/', 'saas', '["saas","vpn","affiliate"]', 'https://cdn.simpleicons.org/nordvpn/4687FF', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-bluehost', 'user-system', 'Bluehost — Affiliate Program', 'Bluehost official affiliate program page: earn commissions on hosting referrals.', 'https://www.bluehost.com/affiliates', 'saas', '["saas","hosting","affiliate"]', 'https://www.google.com/s2/favicons?domain=bluehost.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-siteground', 'user-system', 'SiteGround — Affiliate Program', 'SiteGround official affiliate hosting program page: earn by referring hosting customers.', 'https://www.siteground.com/affiliates', 'saas', '["saas","hosting","affiliate"]', 'https://www.google.com/s2/favicons?domain=siteground.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-hubspot', 'user-system', 'HubSpot — Affiliate Program', 'HubSpot official affiliate program page: promote HubSpot CRM tools and earn commissions.', 'https://www.hubspot.com/partners/affiliates', 'saas', '["saas","crm","affiliate"]', 'https://cdn.simpleicons.org/hubspot/FF7A59', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-kit', 'user-system', 'Kit — Affiliate Program', 'Kit (ConvertKit) official affiliate program page: earn recurring commissions promoting the creator email platform.', 'https://kit.com/affiliate', 'saas', '["saas","email","affiliate"]', 'https://www.google.com/s2/favicons?domain=kit.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-surfshark', 'user-system', 'Surfshark — Affiliate Program', 'Surfshark official affiliate program page: join the VPN affiliate program and earn commissions.', 'https://surfshark.com/affiliate', 'saas', '["saas","vpn","affiliate"]', 'https://cdn.simpleicons.org/surfshark/1780A6', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-expressvpn', 'user-system', 'ExpressVPN — Affiliate Program', 'ExpressVPN official affiliate program page: promote ExpressVPN and earn commissions.', 'https://www.expressvpn.com/affiliates', 'saas', '["saas","vpn","affiliate"]', 'https://cdn.simpleicons.org/expressvpn/DA3B2E', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-udemy', 'user-system', 'Udemy — Affiliate Program', 'Udemy official affiliates program page: become an affiliate and earn promoting online courses.', 'https://www.udemy.com/affiliate/', 'saas', '["saas","education","affiliate"]', 'https://cdn.simpleicons.org/udemy/A435F0', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-skillshare', 'user-system', 'Skillshare — Affiliates', 'Skillshare official affiliates page: earn commissions promoting online classes.', 'https://www.skillshare.com/en/affiliates', 'saas', '["saas","education","affiliate"]', 'https://cdn.simpleicons.org/skillshare/00FF84', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-airbnb', 'user-system', 'Airbnb — Invite Friends', 'Airbnb official invite page: invite friends to join Airbnb (referral program).', 'https://www.airbnb.com/referrals', 'travel', '["travel","referrals","invite"]', 'https://cdn.simpleicons.org/airbnb/FF5A5F', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-rakuten', 'user-system', 'Rakuten — Refer a Friend', 'Rakuten official referral page: refer friends to cash-back shopping and earn rewards.', 'https://www.rakuten.com/referral', 'ecommerce', '["ecommerce","cashback","referrals"]', 'https://cdn.simpleicons.org/rakuten/BF0000', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-walmart', 'user-system', 'Walmart — Affiliate Program', 'Walmart official affiliate program page: drive sales and earn commissions.', 'https://affiliates.walmart.com/', 'ecommerce', '["ecommerce","affiliate","retail"]', 'https://www.google.com/s2/favicons?domain=walmart.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-etsy', 'user-system', 'Etsy — Affiliates & Creators', 'Etsy official affiliates page: earn commissions promoting one-of-a-kind products.', 'https://www.etsy.com/affiliates', 'ecommerce', '["ecommerce","affiliate","marketplace"]', 'https://cdn.simpleicons.org/etsy/F1641E', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-envato', 'user-system', 'Envato — Affiliates', 'Envato official affiliates page: earn by promoting creative assets and templates.', 'https://www.envato.com/affiliates/', 'ecommerce', '["ecommerce","affiliate","creative"]', 'https://cdn.simpleicons.org/envato/81B441', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-fetch', 'user-system', 'Fetch — Refer Friends', 'Fetch official referral page: how to share your Fetch referral code and earn points.', 'https://fetch.com/referral', 'ecommerce', '["ecommerce","rewards","referrals"]', 'https://www.google.com/s2/favicons?domain=fetch.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000);

-- ---------- C) Honey — owner's personal referral link (2026-10-18) ----------
INSERT OR IGNORE INTO referrals (id, user_id, title, description, url, category, tags_json, image_url, status, created_at, updated_at)
VALUES
  ('ref-honey', 'user-system', 'Honey — Join with the Owner''s Link', 'The site owner''s personal Honey referral link: join Honey free, earn rewards and automatic coupon savings at checkout — the owner earns Honey Gold when you join. Labeled owner link, per our disclosure.', 'https://joinhoney.com/ref/a4g6fs4', 'ecommerce', '["ecommerce","cashback","referrals","owner-pick"]', 'https://www.google.com/s2/favicons?domain=joinhoney.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000);

-- ---------- D) Metrics ----------
INSERT OR IGNORE INTO referral_metrics (referral_id, votes, clicks)
VALUES
  ('ref-sofi', 0, 0), ('ref-acorns', 0, 0), ('ref-betterment', 0, 0), ('ref-schwab', 0, 0),
  ('ref-gemini', 0, 0), ('ref-kraken', 0, 0), ('ref-binanceus', 0, 0), ('ref-notion', 0, 0),
  ('ref-canva', 0, 0), ('ref-hostinger', 0, 0), ('ref-namecheap', 0, 0), ('ref-digitalocean', 0, 0),
  ('ref-grammarly', 0, 0), ('ref-nordvpn', 0, 0), ('ref-bluehost', 0, 0), ('ref-siteground', 0, 0),
  ('ref-hubspot', 0, 0), ('ref-kit', 0, 0), ('ref-surfshark', 0, 0), ('ref-expressvpn', 0, 0),
  ('ref-udemy', 0, 0), ('ref-skillshare', 0, 0), ('ref-airbnb', 0, 0), ('ref-rakuten', 0, 0),
  ('ref-walmart', 0, 0), ('ref-etsy', 0, 0), ('ref-envato', 0, 0), ('ref-fetch', 0, 0),
  ('ref-honey', 0, 0);
