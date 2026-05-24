-- Migration: Leaderboard, Rewards, and Creator Analytics
-- Adds tables for real-time leaderboard tracking, referrer/referee bonuses, and creator testimonials

-- Creator Leaderboard & Stats
CREATE TABLE IF NOT EXISTS creator_leaderboard (
    user_id TEXT PRIMARY KEY,
    total_clicks INTEGER DEFAULT 0,
    total_earnings_cents INTEGER DEFAULT 0,
    total_referrals_submitted INTEGER DEFAULT 0,
    avg_clicks_per_referral REAL DEFAULT 0,
    rank INTEGER,
    badge TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum, diamond
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Real-time click & earnings analytics
CREATE TABLE IF NOT EXISTS referral_analytics (
    id TEXT PRIMARY KEY,
    referral_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    clicks_today INTEGER DEFAULT 0,
    clicks_week INTEGER DEFAULT 0,
    clicks_month INTEGER DEFAULT 0,
    earnings_cents_today INTEGER DEFAULT 0,
    earnings_cents_week INTEGER DEFAULT 0,
    earnings_cents_month INTEGER DEFAULT 0,
    conversion_rate REAL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(referral_id)
);

-- Referrer/Referee Reward System
CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY,
    referrer_id TEXT NOT NULL,
    referee_id TEXT,
    referral_program_id TEXT,
    referrer_bonus_cents INTEGER DEFAULT 0,
    referee_bonus_cents INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, earned, paid
    reason TEXT, -- 'first_referral_bonus', 'top_performer_bonus', 'referee_signup'
    created_at INTEGER NOT NULL,
    earned_at INTEGER,
    paid_at INTEGER,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Creator Testimonials & Success Stories
CREATE TABLE IF NOT EXISTS creator_testimonials (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    referral_id TEXT NOT NULL,
    title TEXT NOT NULL,
    story TEXT NOT NULL,
    earnings_cents INTEGER,
    time_period TEXT, -- 'month', 'quarter', 'year'
    image_url TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, published
    created_at INTEGER NOT NULL,
    published_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE
);

-- Creator Badges & Achievements
CREATE TABLE IF NOT EXISTS creator_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_type TEXT NOT NULL, -- 'first_submission', 'top_performer', '100_clicks', '1000_clicks', 'trusted_curator'
    earned_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, badge_type)
);

-- Weekly/Monthly Earnings Summary (for charts & analytics)
CREATE TABLE IF NOT EXISTS earnings_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    referral_id TEXT NOT NULL,
    period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_date TEXT NOT NULL, -- YYYY-MM-DD format
    clicks INTEGER DEFAULT 0,
    earnings_cents INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE,
    UNIQUE(user_id, referral_id, period, period_date)
);

-- Auto-detected Referral Programs (for 1-click submission)
CREATE TABLE IF NOT EXISTS auto_detected_programs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    program_name TEXT,
    signup_url TEXT,
    detection_score REAL DEFAULT 0,
    suggested BOOLEAN DEFAULT 1,
    dismissed BOOLEAN DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, domain)
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_creator_leaderboard_rank ON creator_leaderboard(rank, badge);
CREATE INDEX IF NOT EXISTS idx_referral_analytics_user ON referral_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status, created_at);
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON creator_testimonials(status, published_at);
CREATE INDEX IF NOT EXISTS idx_earnings_history_user_period ON earnings_history(user_id, period_date);
CREATE INDEX IF NOT EXISTS idx_auto_programs_user ON auto_detected_programs(user_id, dismissed);
