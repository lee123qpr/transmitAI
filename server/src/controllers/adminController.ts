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
    getUnifiedNewsletterList,
    getDailyUploadStats,
    getPageVisitStats,
    getTopUsersByUploads
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
import { sendWelcomeUser, sendWelcomeNewsletter } from '../services/emailService';
import Stripe from 'stripe';
import { clerkClient } from '@clerk/clerk-sdk-node';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' as any,
});

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

        // Fetch live revenue from Stripe (last 30 days or current month)
        let totalRevenue = 0;
        try {
            const charges = await stripe.charges.list({
                limit: 100,
                created: {
                    gte: Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000)
                }
            });

            totalRevenue = charges.data
                .filter(charge => charge.paid && !charge.refunded)
                .reduce((sum, charge) => sum + charge.amount, 0) / 100; // Convert cents to dollars/pounds
        } catch (stripeErr) {
            console.error('[Admin] Failed to fetch Stripe revenue:', stripeErr);
        }

        // Fetch live active users from Postgres (seen in last 15 minutes)
        let activeSessionsCount = 0;
        try {
            const liveUsersRes = await query(`
                SELECT COUNT(*) as count 
                FROM users 
                WHERE last_seen_at >= NOW() - INTERVAL '15 minutes'
            `);
            activeSessionsCount = parseInt(liveUsersRes.rows[0].count) || 0;
        } catch (dbErr) {
            console.error('[Admin] Failed to fetch live users from DB:', dbErr);
        }
        res.json({
            stats: {
                totalUsers: parseInt(userCount.rows[0].count),
                totalDocuments: parseInt(docCount.rows[0].count),
                proUsers: parseInt(proCount.rows[0].count),
                revenue: totalRevenue,
                liveUsers: activeSessionsCount,
                recentUsers,
                contentStats,
                recentLogs
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const dailyUploads = await getDailyUploadStats(14); // Last 14 days
        const popularPages = await getPageVisitStats(7, 10); // Last 7 days, top 10
        const topUsers = await getTopUsersByUploads(5); // Top 5

        res.json({
            analytics: {
                dailyUploads,
                popularPages,
                topUsers
            }
        });
    } catch (error) {
        console.error('[Admin] Failed to fetch analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
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

        const formattedMessage = message.replace(/\n/g, '<br/>');

        const htmlTemplate = `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Transmit<span style="color: #2563eb;">.AI</span></h1>
                    <p style="color: #64748b; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 8px;">Admin Team Communication</p>
                </div>
                
                <div style="color: #475569; font-size: 16px; line-height: 1.6; padding: 20px; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                    ${formattedMessage}
                </div>
                
                <p style="color: #475569; font-size: 15px; margin-bottom: 20px;">
                    Best regards,<br/>
                    <strong>Transmit.AI Admin Team</strong>
                </p>
                
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0 20px;" />
                
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
                    Please reply directly to this email if you have any questions.<br/>
                    © ${new Date().getFullYear()} Transmit AI Ltd. All rights reserved.
                </p>
            </div>
        `;

        await resend.emails.send({
            from: 'Transmit.AI Admin Team <support@transmittal.co.uk>',
            to: userEmail,
            subject,
            html: htmlTemplate
        });

        await logAdminAction((req as any).auth?.userId as string, 'send_email', userId, { subject });

        res.json({ success: true });
    } catch (error: any) {
        console.error('[Admin Email Error]', error);
        res.status(500).json({ error: error.message || 'Failed to send email' });
    }
};

export const sendTestWelcomeEmail = async (req: Request, res: Response) => {
    const { email, subject, html } = req.body;
    if (!process.env.RESEND_API_KEY) return res.status(400).json({ error: 'Resend API key not configured' });

    try {
        const targetEmail = email || process.env.ADMIN_EMAIL; // Fallback to admin
        if (!targetEmail) return res.status(400).json({ error: 'No target email specified' });

        if (subject && html) {
            // If frontend provides draft template, send that instead of DB version
            await resend.emails.send({
                from: 'Transmit AI <support@transmittal.co.uk>',
                to: targetEmail,
                subject,
                html
            });
        } else {
            // Fallback to sending the live DB version
            const success = await sendWelcomeUser(targetEmail);
            if (success === false) {
                return res.status(500).json({ error: 'Failed to send test welcome email via Resend' });
            }
        }

        await logAdminAction((req as any).auth?.userId as string, 'test_welcome_email', undefined, { targetEmail });
        res.json({ success: true, message: `Test welcome email sent to ${targetEmail}` });
    } catch (err: any) {
        console.error('[Admin Email Error]', err);
        res.status(500).json({ error: err.message || 'Failed to send test welcome email' });
    }
};

export const sendTestNewsletterEmail = async (req: Request, res: Response) => {
    const { email, subject, html } = req.body;
    if (!process.env.RESEND_API_KEY) return res.status(400).json({ error: 'Resend API key not configured' });

    try {
        const targetEmail = email || process.env.ADMIN_EMAIL;
        if (!targetEmail) return res.status(400).json({ error: 'No target email specified' });

        if (subject && html) {
            // If frontend provides draft template, send that instead of DB version
            await resend.emails.send({
                from: 'Transmit AI <support@transmittal.co.uk>',
                to: targetEmail,
                subject,
                html
            });
        } else {
            const success = await sendWelcomeNewsletter(targetEmail);
            if (success === false) {
                return res.status(500).json({ error: 'Failed to send test newsletter via Resend' });
            }
        }

        await logAdminAction((req as any).auth?.userId as string, 'test_newsletter_email', undefined, { targetEmail });
        res.json({ success: true, message: `Test newsletter sent to ${targetEmail}` });
    } catch (err: any) {
        console.error('[Admin Email Error]', err);
        res.status(500).json({ error: err.message || 'Failed to send test newsletter' });
    }
};
