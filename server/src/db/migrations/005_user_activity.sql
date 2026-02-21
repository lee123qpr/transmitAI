-- Add last_seen_at to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

-- Index for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen_at);
