-- Add last_ip to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip TEXT;

-- Index for searching (optional but good for security investigations)
CREATE INDEX IF NOT EXISTS idx_users_last_ip ON users(last_ip);
