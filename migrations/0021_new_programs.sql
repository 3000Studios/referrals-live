-- 0021_new_programs.sql
-- REBUILD 2026-10-18, phase 2: +8 verified referral/affiliate programs.
-- Every URL below was fetched live 2026-10-18 and its page content read —
-- see ~/workspace/referrals-rebuild/NEW-PROGRAMS.md for the evidence.
-- NO personal referral codes are included: each program issues the
-- owner's personal link only after he signs up (all 8 are on the
-- "needs owner signup" list in the rebuild report). These rows point at
-- the official program pages, exactly like the 0019/0020 catalog rows.
-- Public.com was researched and deliberately EXCLUDED: its own referral
-- terms bar sharing links commercially / with non-personal contacts,
-- which a public deals catalog would violate.
-- Idempotent: INSERT OR IGNORE throughout.

INSERT OR IGNORE INTO referrals (id, user_id, title, description, url, category, tags_json, image_url, status, created_at, updated_at)
VALUES
  ('ref-chime', 'user-system', 'Chime — Referral Program', 'Chime official referral program: both sides earn a cash reward when a new member opens a Chime Checking Account through a referral, receives a qualifying direct deposit of $200 or more within 45 days, and activates their debit card. Reward amount varies by promotion (official blog).', 'https://www.chime.com/blog/chime-referral-program/', 'fintech', '["fintech","banking","referrals"]', 'https://www.google.com/s2/favicons?domain=chime.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-webull', 'user-system', 'Webull — Refer Friends', 'Webull official offers page: refer friends and earn 20 or 100 fractional shares for each qualifying referral (up to 10); new users get 10 fractional shares on a first deposit of $100 or more. Terms apply.', 'https://www.webull.com/offers-promotions/', 'fintech', '["fintech","investing","referrals"]', 'https://www.google.com/s2/favicons?domain=webull.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-paypal', 'user-system', 'PayPal — Invite Friends', 'PayPal official P2P referral terms: invite friends and earn up to 10,000 PayPal Rewards points when ten invited friends join and use PayPal. Points redeem at checkout and in the PayPal app.', 'https://www.paypal.com/us/campaign/invite/terms', 'fintech', '["fintech","payments","referrals"]', 'https://www.google.com/s2/favicons?domain=paypal.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-ibotta', 'user-system', 'Ibotta — Referral Program', 'Ibotta official help: earn referral cash when a new Saver you invite redeems their first offer. The new Saver enters your code at signup and submits a receipt (official help center).', 'https://help.ibotta.com/hc/en-us/articles/225561927-When-do-I-get-referral-cash-for-inviting-a-new-Saver', 'ecommerce', '["ecommerce","cashback","referrals"]', 'https://www.google.com/s2/favicons?domain=ibotta.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-swagbucks', 'user-system', 'Swagbucks — Refer & Earn', 'Swagbucks official help: invite friends with your personal referral link from the Refer & Earn tab and earn from the referral program when they join and earn (official help center).', 'https://help.swagbucks.com/hc/en-us/articles/205641024-How-do-I-invite-someone-to-join-Swagbucks-com', 'ecommerce', '["ecommerce","rewards","referrals"]', 'https://www.google.com/s2/favicons?domain=swagbucks.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-descript', 'user-system', 'Descript — Affiliate Program', 'Descript official affiliate program: earn a commission every time someone subscribes to Descript through your affiliate link, paid to your PayPal via PartnerStack (official affiliate page).', 'https://www.descript.com/affiliate', 'saas', '["saas","video","affiliate"]', 'https://www.google.com/s2/favicons?domain=descript.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-runway', 'user-system', 'Runway — Affiliate Program', 'Runway official affiliate program: earn $15 for every new subscriber who buys a paid plan with your code, uncapped; new users get 25% off any plan. Paid monthly via Stripe (official page).', 'https://runway.com/affiliate-program', 'ai', '["ai","video","affiliate"]', 'https://www.google.com/s2/favicons?domain=runway.com&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ref-elevenlabs', 'user-system', 'ElevenLabs — Creator Affiliate', 'ElevenLabs creator affiliate program (official PartnerStack directory): earn 22% commission on every referred customer transaction for the first 12 months; 11% on business tier, 25% on Reception.', 'https://market.partnerstack.com/page/elevenlabsinc', 'ai', '["ai","voice","affiliate"]', 'https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=256', 'public', strftime('%s','now')*1000, strftime('%s','now')*1000);

INSERT OR IGNORE INTO referral_metrics (referral_id, votes, clicks)
VALUES
  ('ref-chime', 0, 0),
  ('ref-webull', 0, 0),
  ('ref-paypal', 0, 0),
  ('ref-ibotta', 0, 0),
  ('ref-swagbucks', 0, 0),
  ('ref-descript', 0, 0),
  ('ref-runway', 0, 0),
  ('ref-elevenlabs', 0, 0);
