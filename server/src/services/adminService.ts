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
