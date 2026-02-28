import { Request, Response, NextFunction } from 'express';
import { getUser } from '../services/userService';

const ADMIN_EMAILS = [
    (process.env.ADMIN_EMAIL || '').toLowerCase().trim()
].filter(Boolean);

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            console.warn('[Admin] DENIED: No userId in request');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch user from DB
        const user = await getUser(userId);

        if (!user || !user.email) {
            console.warn(`[Admin] DENIED: User not found in DB or no email for ID: ${userId}`);
            return res.status(403).json({ error: `Forbidden: User not found in DB (ID: ${userId})` });
        }

        if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            console.warn(`[Admin] DENIED: Email ${user.email} not in whitelist:`, ADMIN_EMAILS);
            return res.status(403).json({ error: `Forbidden: Admin access only. Your email (${user.email}) is not authorized.` });
        }

        console.log(`[Admin] Access granted for: ${user.email}`);
        next();
    } catch (error) {
        console.error('[Admin Middleware] Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
