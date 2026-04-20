PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS email_captures (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_captures_email ON email_captures(email);
