-- Migration to track payouts for the Trust Ticker
-- Path: migrations/0012_payout_logs.sql

CREATE TABLE IF NOT EXISTS payout_logs (
    id TEXT PRIMARY KEY,
    stripe_payout_id TEXT UNIQUE,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    user_obfuscated_id TEXT, -- e.g., "User_1234"
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- Index for fast lookup of recent payouts
CREATE INDEX IF NOT EXISTS idx_payout_logs_created_at ON payout_logs(created_at DESC);
