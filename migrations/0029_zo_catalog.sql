-- 0029: add the owner's Zo Computer referral link as a catalog entry.
-- Boss order 2026-11-13: add his Zo Computer referral link to referrals.live.
-- Follows the 0022 (US Mobile) / 0026 (Grant) / 0027 (Freelancer) / 0028 (G2A)
-- pattern: the owner's personal link as its own catalog row, so it gets a
-- clean /go/ref-zo redirect carrying the real link. Link as the owner
-- provided it in chat on 2026-11-13, with the share-tracking utm parameters
-- dropped and the referral parameter (r=72373s) kept — that parameter is
-- what attributes the referral to the owner.
INSERT OR IGNORE INTO referrals
  (id, user_id, title, description, url, category, tags_json, image_url, status, created_at, updated_at)
VALUES
  ('ref-zo', 'user-system', 'Zo Computer — Personal Cloud Computer with AI',
   'The site owner''s Zo referral link: Zo is a personal cloud computer with AI built in — an always-on computer of your own for building sites, apps and automations. Join through this link and subscribe to a paid Zo plan and the owner earns $10 cash while you get $10 in AI credits, under Zo''s current referral terms.',
   'https://zocomputer.substack.com/p/earn-cash-for-everyone-you-subscribe?r=72373s',
   'ai', '["ai","cloud","computing","referrals"]',
   'https://www.google.com/s2/favicons?domain=zo.computer&sz=256',
   'public', 1794629350814, 1794629350814);

INSERT OR IGNORE INTO referral_metrics (referral_id, votes, clicks)
VALUES ('ref-zo', 0, 0);
