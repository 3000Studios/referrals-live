-- 0027: add the owner's Freelancer reference invitation as a catalog entry.
-- Boss order 2026-11-06: add lots more of his referral links to
-- referrals.live. Follows the 0022 (US Mobile) / 0026 (Grant) pattern: the
-- owner's personal link as its own catalog row, so it gets a clean
-- /offer/ref-freelancer redirect carrying the real link. Link recorded
-- verbatim in ~/workspace/referrals-live/HIS-LINKS.md (Part 1, #3; source:
-- workspace memory records). NOT applied to production D1 by this change —
-- local build only, deploy stays a separate approved step.
INSERT OR IGNORE INTO referrals
  (id, user_id, title, description, url, category, tags_json, image_url, status, created_at, updated_at)
VALUES
  ('ref-freelancer', 'user-system', 'Freelancer — Reference Invitation',
   'The site owner''s Freelancer reference-invitation link: leave a reference for 3000 Studios (username TopPickJeremy) or connect about project work through his Freelancer profile.',
   'https://www.freelancer.com/external-references/invitation/TopPickJeremy',
   'saas', '["freelance","work","referrals"]',
   'https://www.google.com/s2/favicons?domain=freelancer.com&sz=256',
   'public', 1793941200000, 1793941200000);

INSERT OR IGNORE INTO referral_metrics (referral_id, votes, clicks)
VALUES ('ref-freelancer', 0, 0);
