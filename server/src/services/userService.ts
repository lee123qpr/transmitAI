import { query } from '../db';

export interface User {
    id: string;
    email: string;
    subscription_tier: 'free' | 'pro' | 'business';
    documents_usage: number;
    documents_limit: number;
    company_name?: string;
    company_logo_url?: string;
    status: 'active' | 'suspended';
    newsletter_subscribed: boolean;
    last_seen_at?: string;
    last_ip?: string;
}

const getString = (val: any) => (val === null || val === undefined ? '' : String(val));

export const updateLastSeen = async (userId: string, ip: string): Promise<void> => {
    try {
        await query(
            'UPDATE users SET last_seen_at = NOW(), last_ip = $2 WHERE id = $1',
            [userId, ip]
        );
    } catch (err) {
        console.error('[UserService] updateLastSeen error:', err);
    }
};

export const getUser = async (userId: string): Promise<User | null> => {
    const res = await query('SELECT * FROM users WHERE id = $1', [userId]);
    return res.rows[0] || null;
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<User | null> => {
    const fields: string[] = [];
    const values: any[] = [];
    let queryText = 'UPDATE users SET ';

    if (data.company_name !== undefined) {
        fields.push(`company_name = $${fields.length + 2}`);
        values.push(data.company_name);
    }

    if (data.company_logo_url !== undefined) {
        fields.push(`company_logo_url = $${fields.length + 2}`);
        values.push(data.company_logo_url);
    }

    if (fields.length === 0) return null;

    queryText += fields.join(', ') + `, updated_at = NOW() WHERE id = $1 RETURNING *`;

    const res = await query(queryText, [userId, ...values]);
    return res.rows[0] || null;
};

export const createUser = async (userId: string, email: string): Promise<User> => {
    const tier = 'free';
    const limit = 10;

    const res = await query(
        `INSERT INTO users (id, email, subscription_tier, documents_usage, documents_limit, status, newsletter_subscribed)
         VALUES ($1, $2, $3, 0, $4, 'active', false)
         RETURNING *`,
        [userId, email, tier, limit]
    );
    return res.rows[0];
};

export const incrementUsage = async (userId: string): Promise<User> => {
    const res = await query(
        `UPDATE users 
         SET documents_usage = documents_usage + 1,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [userId]
    );
    return res.rows[0];
};

export const updateUserTier = async (userId: string, tier: string, limit: number): Promise<User> => {
    const res = await query(
        `UPDATE users 
         SET subscription_tier = $2, documents_limit = $3, updated_at = NOW() 
         WHERE id = $1 RETURNING *`,
        [userId, tier, limit]
    );
    return res.rows[0];
};

export const setUserStatus = async (userId: string, status: string): Promise<User> => {
    const res = await query(
        `UPDATE users SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [userId, status]
    );
    return res.rows[0];
};

export const toggleNewsletter = async (userId: string, subscribed: boolean): Promise<User> => {
    const res = await query(
        `UPDATE users SET newsletter_subscribed = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [userId, subscribed]
    );
    return res.rows[0];
};

export const getUsers = async (search?: string): Promise<User[]> => {
    let queryText = 'SELECT * FROM users ORDER BY created_at DESC LIMIT 50';
    let params: any[] = [];
    if (search) {
        queryText = 'SELECT * FROM users WHERE email ILIKE $1 ORDER BY created_at DESC LIMIT 50';
        params = [`%${search}%`];
    }
    const res = await query(queryText, params);
    return res.rows;
};

export const checkLimit = async (userId: string): Promise<{ allowed: boolean; message?: string }> => {
    const user = await getUser(userId);
    if (!user) return { allowed: false, message: 'User not found' };

    if (user.status === 'suspended') {
        return { allowed: false, message: 'Your account has been suspended. Please contact support.' };
    }

    if (user.documents_usage >= user.documents_limit) {
        return {
            allowed: false,
            message: `You have reached your limit of ${user.documents_limit} documents. Please upgrade to Pro.`
        };
    }

    return { allowed: true };
};

export const getActualDocumentCount = async (userId: string): Promise<number> => {
    const res = await query('SELECT COUNT(*) as count FROM documents WHERE user_id = $1', [userId]);
    return parseInt(res.rows[0].count || '0', 10);
};

export const syncUsage = async (userId: string): Promise<void> => {
    try {
        const count = await getActualDocumentCount(userId);
        await query(
            'UPDATE users SET documents_usage = $2, updated_at = NOW() WHERE id = $1',
            [userId, count]
        );
        console.log(`[UserService] Synced usage for ${userId}: ${count} docs`);
    } catch (err) {
        console.error('[UserService] syncUsage error:', err);
    }
};
