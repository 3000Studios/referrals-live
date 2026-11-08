-- 0028: add the owner's G2A referral link as a catalog entry.
-- Boss order 2026-11-08: add his G2A referral link to referrals.live.
-- Follows the 0022 (US Mobile) / 0026 (Grant) / 0027 (Freelancer) pattern: the
-- owner's personal link as its own catalog row, so it gets a clean
-- /go/ref-g2a redirect carrying the real link. Link used verbatim as the
-- owner provided it in chat on 2026-11-08.
INSERT OR IGNORE INTO referrals
  (id, user_id, title, description, url, category, tags_json, image_url, status, created_at, updated_at)
VALUES
  ('ref-g2a', 'user-system', 'G2A — Game Keys & Digital Deals',
   'The site owner''s G2A referral link: shop game keys, gift cards and digital software on the G2A marketplace through this link — referral rewards apply under G2A''s current referral terms.',
   'https://www.g2a.com/n/reflink-b5f89b7398',
   'ecommerce', '["gaming","game-keys","marketplace","referrals"]',
   'https://www.google.com/s2/favicons?domain=g2a.com&sz=256',
   'public', 1794165841151, 1794165841151);

INSERT OR IGNORE INTO referral_metrics (referral_id, votes, clicks)
VALUES ('ref-g2a', 0, 0);
