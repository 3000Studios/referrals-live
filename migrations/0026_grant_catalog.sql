-- 0026: add the owner's Grant cash advance referral as a catalog entry.
-- Boss order 2026-11-02: put his Grant invite link on referrals.live.
-- Follows the 0022 (US Mobile) pattern: the owner's personal referral
-- link as its own catalog row, so it gets a clean /offer/ref-grant
-- redirect carrying the real link. Link used verbatim as the owner
-- provided it in chat on 2026-11-02.
INSERT OR IGNORE INTO referrals
  (id, user_id, title, description, url, category, tags_json, image_url, status, created_at, updated_at)
VALUES
  ('ref-grant', 'user-system', 'Grant — Cash Advance Referral',
   'The site owner''s Grant referral link: I''ve been using the Grant app to get cash advances and boost my finances — join through this invite and you''ll get a bonus when you join, under Grant''s current referral terms. Grant offers cash advances of $25–$500 with no credit check (eligibility and full terms at grantcash.com/legal).',
   'https://grantcash.onelink.me/Kt7A?af_xp=referral&pid=user_referral&c=user_referral&deep_link_value=user_referral&deep_link_sub1=UXZME5GPMK',
   'fintech', '["fintech","cash-advance","referrals"]',
   'https://www.google.com/s2/favicons?domain=grantcash.com&sz=256',
   'public', 1793599447711, 1793599447711);

INSERT OR IGNORE INTO referral_metrics (referral_id, votes, clicks)
VALUES ('ref-grant', 0, 0);
