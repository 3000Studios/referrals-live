-- 0024: Google sign-in (OAuth) support. google_sub is the Google account's
-- stable subject id; email/password accounts keep it NULL. The partial
-- unique index keeps one account per Google identity.
ALTER TABLE users ADD COLUMN google_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL;
