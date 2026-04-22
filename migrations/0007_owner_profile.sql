PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS owner_profile (
  id TEXT PRIMARY KEY,
  owner_name TEXT,
  owner_email TEXT,
  paypal_email TEXT,
  venmo_handle TEXT,
  stripe_email TEXT,
  default_referral_code TEXT,
  notes_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL
);
