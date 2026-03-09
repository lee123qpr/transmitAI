-- Create system errors logging table
CREATE TABLE IF NOT EXISTS system_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(50) NOT NULL CHECK (level IN ('warning', 'error', 'critical', 'fatal')),
    source VARCHAR(50) NOT NULL CHECK (source IN ('frontend', 'backend', 'worker')),
    message TEXT NOT NULL,
    stack_trace TEXT,
    url TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_system_errors_status ON system_errors(status);
CREATE INDEX IF NOT EXISTS idx_system_errors_level ON system_errors(level);
CREATE INDEX IF NOT EXISTS idx_system_errors_created_at ON system_errors(created_at);
