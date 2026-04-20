PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS owner_attribution (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  params_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_owner_attr_domain ON owner_attribution(domain);
