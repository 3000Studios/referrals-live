-- 0023: per-program terms check for member-submitted links (business-model
-- terms risk, 2026-10-27). Many refer-a-friend programs bar public posting,
-- so a member must attest the program allows it before a link can be a
-- public candidate; flagged programs are held out of the homepage boxes.
ALTER TABLE referrals ADD COLUMN terms_attested INTEGER NOT NULL DEFAULT 0;
ALTER TABLE referrals ADD COLUMN terms_flagged INTEGER NOT NULL DEFAULT 0;
