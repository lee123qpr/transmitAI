import { query } from '../db';

export interface SystemSetting {
    key: string;
    value: any;
    updated_at: string;
}

export interface BlockedIP {
    ip: string;
    reason?: string;
    created_at: string;
}

export interface AuditLog {
    id: string;
    admin_id: string;
    action: string;
    target_id?: string;
    details?: any;
    created_at: string;
}

export const getSystemSettings = async (): Promise<SystemSetting[]> => {
    const res = await query('SELECT * FROM system_settings');
    return res.rows;
};

export const updateSystemSetting = async (key: string, value: any, adminId: string): Promise<void> => {
    await query(
        'INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
        [key, JSON.stringify(value)]
    );
    await logAdminAction(adminId, 'update_setting', key, { value });
};

export const getBlockedIPs = async (): Promise<BlockedIP[]> => {
    const res = await query('SELECT * FROM blocked_ips ORDER BY created_at DESC');
    return res.rows;
};

export const blockIP = async (ip: string, reason: string, adminId: string): Promise<void> => {
    await query(
        'INSERT INTO blocked_ips (ip, reason) VALUES ($1, $2) ON CONFLICT (ip) DO UPDATE SET reason = $2',
        [ip, reason]
    );
    await logAdminAction(adminId, 'block_ip', ip, { reason });
};

export const unblockIP = async (ip: string, adminId: string): Promise<void> => {
    await query('DELETE FROM blocked_ips WHERE ip = $1', [ip]);
    await logAdminAction(adminId, 'unblock_ip', ip);
};

export const isIPBlocked = async (ip: string): Promise<boolean> => {
    const res = await query('SELECT 1 FROM blocked_ips WHERE ip = $1', [ip]);
    return res.rowCount ? res.rowCount > 0 : false;
};

export const getAuditLogs = async (limit = 100): Promise<AuditLog[]> => {
    const res = await query('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT $1', [limit]);
    return res.rows;
};

export const logAdminAction = async (adminId: string, action: string, targetId?: string, details?: any): Promise<void> => {
    await query(
        'INSERT INTO admin_audit_logs (admin_id, action, target_id, details) VALUES ($1, $2, $3, $4)',
        [adminId, action, targetId, details ? JSON.stringify(details) : null]
    );
};

export const getRecentUsers = async (limit = 5) => {
    const res = await query('SELECT id, email, created_at, status FROM users ORDER BY created_at DESC LIMIT $1', [limit]);
    return res.rows;
};

export const getContentStats = async () => {
    const articlesRes = await query(`
        SELECT 
            COUNT(*) FILTER (WHERE published = true) as published,
            COUNT(*) FILTER (WHERE published = false) as drafts
        FROM articles
    `);
    const newsletterRes = await query(`
        SELECT (
            SELECT COUNT(*) FROM users WHERE newsletter_subscribed = true
        ) + (
            SELECT COUNT(*) FROM newsletter_subscribers
        ) as count
    `);

    return {
        articles: {
            published: parseInt(articlesRes.rows[0].published || '0'),
            drafts: parseInt(articlesRes.rows[0].drafts || '0')
        },
        newsletterSubscribers: parseInt(newsletterRes.rows[0].count || '0')
    };
};

export const getSystemHealth = async () => {
    const startTime = Date.now();
    let dbStatus = 'healthy';
    let dbLatency = 0;

    try {
        await query('SELECT 1');
        dbLatency = Date.now() - startTime;
    } catch (err) {
        dbStatus = 'unhealthy';
    }

    return {
        status: dbStatus === 'healthy' ? 'healthy' : 'unhealthy',
        database: {
            status: dbStatus,
            latency: dbLatency
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    };
};

export const getNewsletterSubscribers = async () => {
    const res = await query(`
        SELECT email, created_at, 'public' as source FROM newsletter_subscribers
        UNION
        SELECT email, created_at, 'registered' as source FROM users WHERE newsletter_subscribed = true
        ORDER BY created_at DESC
    `);
    return res.rows;
};

export const getFullUserList = async () => {
    const res = await query('SELECT email, company_name, created_at, status, subscription_tier, last_seen_at FROM users ORDER BY created_at DESC');
    return res.rows;
};

export const getPublicSubscribers = async () => {
    const res = await query("SELECT email, created_at, 'public' as source FROM newsletter_subscribers ORDER BY created_at DESC");
    return res.rows;
};

export const getUnifiedNewsletterList = async () => {
    const res = await query(`
        SELECT email, created_at, 'public' as source FROM newsletter_subscribers
        UNION
        SELECT email, created_at, 'registered' as source FROM users WHERE newsletter_subscribed = true
        ORDER BY created_at DESC
    `);
    return res.rows;
};

// --- Analytics ---

export const recordPageVisit = async (path: string, userId?: string, sessionId?: string) => {
    try {
        await query(
            'INSERT INTO page_visits (path, user_id, session_id) VALUES ($1, $2, $3)',
            [path, userId || null, sessionId || null]
        );
    } catch (err) {
        console.error('[Analytics] Failed to record page visit:', err);
    }
};

export const getDailyUploadStats = async (days = 7) => {
    const res = await query(`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM documents 
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
    `);
    return res.rows;
};

export const getPageVisitStats = async (days = 7, limit = 10) => {
    const res = await query(`
        SELECT path, COUNT(*) as views 
        FROM page_visits 
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY path 
        ORDER BY views DESC 
        LIMIT $1
    `, [limit]);
    return res.rows;
};

export const getTopUsersByUploads = async (limit = 5) => {
    const res = await query(`
        SELECT u.email, u.company_name, COUNT(d.id) as total_uploads 
        FROM users u
        LEFT JOIN documents d ON u.id = d.user_id
        GROUP BY u.id, u.email, u.company_name
        ORDER BY total_uploads DESC
        LIMIT $1
    `, [limit]);
    return res.rows;
};

// --- Error Tracking & Alerts ---

export const logSystemError = async ({
    level, source, message, stackTrace = null, url = null, userId = null, metadata = null
}: {
    level: 'warning' | 'error' | 'critical' | 'fatal',
    source: 'frontend' | 'backend' | 'worker',
    message: string,
    stackTrace?: string | null,
    url?: string | null,
    userId?: string | null,
    metadata?: any
}) => {
    try {
        await query(
            `INSERT INTO system_errors 
            (level, source, message, stack_trace, url, user_id, metadata) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [level, source, message, stackTrace, url, userId, metadata ? JSON.stringify(metadata) : null]
        );
    } catch (dbErr) {
        console.error('[ErrorTracker] Failed to persist system error:', dbErr);
    }
};

export const getSystemErrors = async (status = 'open', limit = 50, offset = 0) => {
    const res = await query(`
        SELECT id, level, source, message, stack_trace, url, user_id, metadata, status, created_at, resolved_at
        FROM system_errors
        WHERE status = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
    `, [status, limit, offset]);
    return res.rows;
};

export const updateErrorStatus = async (id: string, status: 'open' | 'investigating' | 'resolved' | 'ignored') => {
    const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
    await query(`
        UPDATE system_errors 
        SET status = $1, resolved_at = COALESCE($2, resolved_at) 
        WHERE id = $3
    `, [status, resolvedAt, id]);
};

export const getErrorStats = async () => {
    const res = await query(`
        SELECT 
            COUNT(*) FILTER (WHERE status = 'open') as open_count,
            COUNT(*) FILTER (WHERE level IN ('critical', 'fatal') AND status = 'open') as critical_count,
            COUNT(*) FILTER (WHERE status = 'resolved' AND resolved_at >= NOW() - INTERVAL '24 hours') as resolved_24h
        FROM system_errors
    `);

    return {
        openCount: parseInt(res.rows[0].open_count || '0'),
        criticalCount: parseInt(res.rows[0].critical_count || '0'),
        resolved24h: parseInt(res.rows[0].resolved_24h || '0')
    };
};
