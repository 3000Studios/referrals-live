-- 0022: add the owner's US Mobile referral as a proper catalog entry.
-- The link previously lived (wrongly) in owner_profile.default_referral_code,
-- which sprayed the full URL into other programs' ref= params via /go
-- (P0 audit FAIL #2, 2026-10-27). As its own catalog row it gets a clean
-- /go/ref-usmobile redirect carrying the real link. Link salvaged verbatim
-- from the live owner_profile on 2026-10-27 (OWNER-PROFILE-SALVAGE.md).
INSERT OR IGNORE INTO referrals
  (id, user_id, title, description, url, category, tags_json, image_url, status, created_at, updated_at)
VALUES
  ('ref-usmobile', 'user-system', 'US Mobile — Refer a Friend',
   'The site owner''s US Mobile referral link: join US Mobile through this link and referral rewards apply under US Mobile''s current referral terms. Prepaid phone plans on major US networks.',
   'https://www.usmobile.com/referrals?referrer=B15A26AD&name=Incoming&utm_page_url=monster_referral',
   'mobile', '["mobile","wireless","prepaid"]',
   'https://www.google.com/s2/favicons?domain=usmobile.com&sz=256',
   'public', 1793113200000, 1793113200000);

INSERT OR IGNORE INTO referral_metrics (referral_id, votes, clicks)
VALUES ('ref-usmobile', 0, 0);
