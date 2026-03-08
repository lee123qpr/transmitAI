-- Create page visits table for analytics
CREATE TABLE IF NOT EXISTS page_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path VARCHAR(255) NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON page_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_path ON page_visits(path);
