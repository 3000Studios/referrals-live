-- 0018_fix_dead_offers.sql
-- Fixes from the 2026-10-11 browser click-through audit of referrals.live.
-- Dead/wrong outbound destinations + attribution params that sent visitors
-- out with a placeholder code or another program's referral value.
-- Mirrors the seed corrections in 0002_seed_public.sql and workers/ingest.ts.

-- 1) Revolut: revolut.com/legal/referrals/ is gone (404) and Revolut runs
--    referrals in-app only. Point at the official help page that documents
--    the current referral program (the public program page that exists).
UPDATE referrals
SET title = 'Revolut — Referral Program',
    description = 'How Revolut referrals work: invite friends and earn rewards when they sign up, add money, order a card, and make purchases (official help).',
    url = 'https://help.revolut.com/en-SG/help/referrals/other/what-are-the-requirements-to-get-my-referral-reward/',
    updated_at = strftime('%s','now')*1000
WHERE id = 'ref-revolut';

-- 2) Uber: uber.com/us/en/affiliate/ is dead. Current affiliate program page:
UPDATE referrals
SET url = 'https://www.uber.com/us/en/affiliate-program/',
    updated_at = strftime('%s','now')*1000
WHERE id = 'ref-uberaff';

-- 3) Wise: the stored help-article URL no longer lands on invite content.
--    Point at Wise's actual invite page.
UPDATE referrals
SET title = 'Wise — Invite Friends',
    description = 'Invite friends to Wise and earn rewards (official invite page). Great for audiences doing international transfers.',
    url = 'https://wise.com/invite',
    updated_at = strftime('%s','now')*1000
WHERE id = 'ref-wise';
UPDATE ingested_offers
SET title = 'Wise — Invite Friends',
    description = 'Invite friends to Wise and earn rewards (official invite page).',
    url = 'https://wise.com/invite',
    updated_at = strftime('%s','now')*1000
WHERE id = 'ref-wise';

-- 4) Coinbase: the stored help-center URL returns 404. Point at Coinbase's
--    official referral program page.
UPDATE referrals
SET description = 'Coinbase official referral program page: how to earn crypto bonuses by inviting friends.',
    url = 'https://www.coinbase.com/legal/international-referral',
    updated_at = strftime('%s','now')*1000
WHERE id = 'ref-coinbase';

-- 5) Attribution cleanup (owner_attribution):
--    shopify.com / uber.com / wise.com carried {"ref": "{{DEFAULT_REFERRAL_CODE}}"}
--    and the owner's default code is a US Mobile referral value, so every
--    outbound click for these programs went out with US Mobile's ref.
--    These programs take no generic public ref param; their own referral
--    link (when the owner has one) belongs in the program URL itself.
--    Clearing params keeps the /go utm tags and drops the foreign ref.
UPDATE owner_attribution
SET params_json = '{}', updated_at = strftime('%s','now')*1000
WHERE domain IN ('shopify.com', 'uber.com', 'wise.com');

-- 6) Placeholder params: dropbox.com and capcut.com carried
--    {"ref": "YOUR_CODE_HERE"} — visitors were sent out with a fake code.
--    Clear the param; the click now lands on the program page clean
--    (Dropbox's stored program URL already carries the owner's real
--    referral token). Re-add a real per-domain code here only when the
--    owner supplies one.
UPDATE owner_attribution
SET params_json = '{}', updated_at = strftime('%s','now')*1000
WHERE domain IN ('dropbox.com', 'capcut.com');

-- NOTE (not changed here, flagged for owner review): the remaining
-- owner_attribution rows that use {{DEFAULT_REFERRAL_CODE}} have the same
-- cross-program problem as (5) — the default code is program-specific and
-- should only ever apply to its own program's domain.
