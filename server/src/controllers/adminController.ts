import { Request, Response } from 'express';
import { query } from '../db';
import { Resend } from 'resend';
import {
    getSystemHealth,
    getSystemSettings,
    updateSystemSetting,
    getBlockedIPs,
    blockIP,
    unblockIP,
    getAuditLogs,
    logAdminAction,
    getRecentUsers,
    getContentStats,
    getNewsletterSubscribers,
    getFullUserList,
    getPublicSubscribers,
    getUnifiedNewsletterList
} from '../services/adminService';
import {
    getArticles,
    upsertArticle,
    deleteArticle,
    getAnnouncements,
    upsertAnnouncement,
    deleteAnnouncement
} from '../services/cmsService';
import {
    getUsers as fetchAllUsers,
    updateUserTier,
    setUserStatus,
    toggleNewsletter
} from '../services/userService';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

// Health & Stats
export const getHealth = async (req: Request, res: Response) => {
    try {
        const health = await getSystemHealth();
        res.json(health);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch health' });
    }
};

export const getStats = async (req: Request, res: Response) => {
    try {
        const userCount = await query('SELECT COUNT(*) FROM users');
        const docCount = await query('SELECT COUNT(*) FROM documents');
        const proCount = await query('SELECT COUNT(*) FROM users WHERE subscription_tier = \'pro\'');

        const recentUsers = await getRecentUsers(5);
        const contentStats = await getContentStats();
        const recentLogs = await getAuditLogs(5);

        res.json({
            stats: {
                totalUsers: parseInt(userCount.rows[0].count),
                totalDocuments: parseInt(docCount.rows[0].count),
                proUsers: parseInt(proCount.rows[0].count),
                revenue: 0,
                recentUsers,
                contentStats,
                recentLogs
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

// User Management
export const getUsers = async (req: Request, res: Response) => {
    try {
        const { search } = req.query as { search?: string };
        const users = await fetchAllUsers(search);
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const updateTier = async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const { tier, limit } = req.body;
    try {
        const user = await updateUserTier(userId, tier, limit);
        await logAdminAction((req as any).auth?.userId as string, 'update_tier', userId, { tier, limit });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update tier' });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const { status } = req.body;
    try {
        const user = await setUserStatus(userId, status);
        await logAdminAction((req as any).auth?.userId as string, 'update_status', userId, { status });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status' });
    }
};

export const updateNewsletter = async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const { subscribed } = req.body;
    try {
        const user = await toggleNewsletter(userId, subscribed);
        await logAdminAction((req as any).auth?.userId as string, 'update_newsletter', userId, { subscribed });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update newsletter' });
    }
};

// CMS
export const listArticles = async (req: Request, res: Response) => {
    try {
        const articles = await getArticles();
        console.log(`[Admin] Fetched ${articles.length} articles`);
        res.json({ articles });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch articles' });
    }
};

export const saveArticle = async (req: Request, res: Response) => {
    try {
        const article = await upsertArticle(req.body, (req as any).auth?.userId as string);
        res.json(article);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save article' });
    }
};

export const removeArticle = async (req: Request, res: Response) => {
    try {
        await deleteArticle(req.params.id as string, (req as any).auth?.userId as string);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete article' });
    }
};

export const listAnnouncements = async (req: Request, res: Response) => {
    try {
        const list = await getAnnouncements();
        res.json({ announcements: list });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
};

export const saveAnnouncement = async (req: Request, res: Response) => {
    try {
        const item = await upsertAnnouncement(req.body, (req as any).auth?.userId as string);
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save announcement' });
    }
};

export const removeAnnouncement = async (req: Request, res: Response) => {
    try {
        await deleteAnnouncement(req.params.id as string, (req as any).auth?.userId as string);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
};

// Settings & Security
export const listSettings = async (req: Request, res: Response) => {
    try {
        const settings = await getSystemSettings();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

export const saveSetting = async (req: Request, res: Response) => {
    const { key, value } = req.body;
    try {
        await updateSystemSetting(key, value, (req as any).auth?.userId as string);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update setting' });
    }
};

export const listBlockedIPs = async (req: Request, res: Response) => {
    try {
        const ips = await getBlockedIPs();
        res.json(ips);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch blocked IPs' });
    }
};

export const blockNewIP = async (req: Request, res: Response) => {
    const { ip, reason } = req.body;
    try {
        await blockIP(ip as string, reason as string, (req as any).auth?.userId as string);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to block IP' });
    }
};

export const unblockExistingIP = async (req: Request, res: Response) => {
    const { ip } = req.params as { ip: string };
    try {
        await unblockIP(ip, (req as any).auth?.userId as string);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to unblock IP' });
    }
};

export const fetchLogs = async (req: Request, res: Response) => {
    try {
        const logs = await getAuditLogs();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

export const listNewsletterSubscribers = async (req: Request, res: Response) => {
    try {
        const subscribers = await getNewsletterSubscribers();
        res.json({ subscribers });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
};

export const exportUsers = async (req: Request, res: Response) => {
    try {
        const users = await getFullUserList();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to export users' });
    }
};

export const exportNewsletter = async (req: Request, res: Response) => {
    try {
        const { mode } = req.query as { mode?: string };
        const subscribers = mode === 'unified'
            ? await getUnifiedNewsletterList()
            : await getPublicSubscribers();
        res.json(subscribers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to export newsletter' });
    }
};

// Original Email Action
export const sendUserEmail = async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const { subject, message } = req.body;

    if (!process.env.RESEND_API_KEY) {
        return res.status(400).json({ error: 'Resend API key not configured' });
    }

    try {
        const userRes = await query('SELECT email FROM users WHERE id = $1', [userId]);
        const userEmail = userRes.rows[0]?.email;

        if (!userEmail) {
            return res.status(404).json({ error: 'User email not found' });
        }

        await resend.emails.send({
            from: 'Admin <support@transmittal.co.uk>',
            to: userEmail,
            subject,
            text: message
        });

        await logAdminAction((req as any).auth?.userId as string, 'send_email', userId, { subject });

        res.json({ success: true });
    } catch (error: any) {
        console.error('[Admin Email Error]', error);
        res.status(500).json({ error: error.message || 'Failed to send email' });
    }
};

export const sendTestWelcomeEmail = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!process.env.RESEND_API_KEY) return res.status(400).json({ error: 'Resend API key not configured' });

    try {
        const targetEmail = email || process.env.ADMIN_EMAIL; // Fallback to admin
        const { error } = await resend.emails.send({
            from: 'Welcome <support@transmittal.co.uk>',
            to: targetEmail,
            subject: 'Welcome to Transmittal!',
            html: '<p>Hi there,</p><p>Welcome to Transmittal! We are excited to have you on board.</p>'
        });

        if (error) {
            console.error('[Resend Error]', error);
            return res.status(500).json({ error: error.message || 'Failed to send test welcome email' });
        }

        await logAdminAction((req as any).auth?.userId as string, 'test_welcome_email', undefined, { targetEmail });
        res.json({ success: true, message: `Test welcome email sent to ${targetEmail}` });
    } catch (err: any) {
        console.error('[Admin Email Error]', err);
        res.status(500).json({ error: err.message || 'Failed to send test welcome email' });
    }
};

export const sendTestNewsletterEmail = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!process.env.RESEND_API_KEY) return res.status(400).json({ error: 'Resend API key not configured' });

    try {
        const targetEmail = email || process.env.ADMIN_EMAIL;
        const { error } = await resend.emails.send({
            from: 'Newsletter <support@transmittal.co.uk>',
            to: targetEmail,
            subject: 'Transmittal Weekly Update (TEST)',
            html: '<p>This is a test of the newsletter broadcast system.</p>'
        });

        if (error) {
            console.error('[Resend Error]', error);
            return res.status(500).json({ error: error.message || 'Failed to send test newsletter' });
        }

        await logAdminAction((req as any).auth?.userId as string, 'test_newsletter_email', undefined, { targetEmail });
        res.json({ success: true, message: `Test newsletter sent to ${targetEmail}` });
    } catch (err: any) {
        console.error('[Admin Email Error]', err);
        res.status(500).json({ error: err.message || 'Failed to send test newsletter' });
    }
};
