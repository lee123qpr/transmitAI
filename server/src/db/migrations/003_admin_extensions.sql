-- User Moderation Extensions
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- System Settings (Maintenance Mode, Global Banner)
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed defaults if not exists
INSERT INTO system_settings (key, value) VALUES ('maintenance_mode', 'false'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO system_settings (key, value) VALUES ('announcement_banner', '{"active": false, "message": "", "type": "info"}'::jsonb) ON CONFLICT (key) DO NOTHING;

-- Security: Blocked IPs
CREATE TABLE IF NOT EXISTS blocked_ips (
    ip VARCHAR(255) PRIMARY KEY,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL, -- 'suspend_user', 'change_tier', 'block_ip', etc.
    target_id VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at);
