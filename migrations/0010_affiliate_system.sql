-- Migration for Affiliate Tracking System
-- Apply with: npx wrangler d1 migrations apply referrals-live --remote

-- Add referral_code to users if not exists (standard D1 doesn't support ALTER TABLE easily for multiple things)
-- We'll create a new table and copy if needed, but for this migration we'll just add the tracking tables.

CREATE TABLE IF NOT EXISTS affiliate_stats (
    user_id TEXT PRIMARY KEY,
    referral_code TEXT UNIQUE NOT NULL,
    balance_cents INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversions (
    id TEXT PRIMARY KEY,
    referrer_id TEXT NOT NULL,
    referred_user_id TEXT,
    code TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, completed, paid
    created_at INTEGER NOT NULL,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS click_logs (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    ip_hash TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL
);
