import { ClerkExpressRequireAuth, StrictAuthProp } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

// Shim to add auth to Request type locally
declare global {
    namespace Express {
        interface Request extends StrictAuthProp { }
    }
}

// Custom wrapper or direct export depending on error handling needs
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.E2E_TEST === 'true' && req.headers.authorization === 'Bearer mock_token') {
        req.auth = { userId: 'test_user_123', sessionId: 'mock_session' } as any;
        // Auto-create the test user in the DB if it doesn't exist yet, with Pro limits
        try {
            const { getUser, createUser } = require('../services/userService');
            const { query } = require('../db');
            const existing = await getUser('test_user_123');
            if (!existing) {
                await createUser('test_user_123', 'test@transmittal.co.uk');
                // Elevate to Pro so tests run without hitting the 10 doc free limit
                await query(
                    `UPDATE users SET subscription_tier = 'pro', documents_limit = 9999, documents_usage = 0 WHERE id = $1`,
                    ['test_user_123']
                );
                console.log('[E2E] Auto-created test_user_123 with Pro limits');
            } else {
                // Reset usage counter each run so we start fresh
                await query(
                    `UPDATE users SET subscription_tier = 'pro', documents_limit = 9999, documents_usage = 0 WHERE id = $1`,
                    ['test_user_123']
                );
            }
        } catch (e) {
            console.warn('[E2E] Could not auto-create/update test user:', e);
        }
        return next();
    }

    // Cast to 'any' to avoid TS conflict between local Express types and Clerk SDK Express types
    (ClerkExpressRequireAuth() as any)(req, res, (err: any) => {
        if (err) {
            console.error('[Auth Middleware] Error:', err);
            // Clerk's middleware might pass an error if strict auth fails
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // If we get here, Clerk has verified the token and populated req.auth
        if (!req.auth?.userId) {
            return res.status(401).json({ error: 'Unauthorized: No User ID found' });
        }

        // Update Last Seen (Async - don't block request)
        const { updateLastSeen } = require('../services/userService');
        const ip = req.ip || req.socket.remoteAddress || '';
        updateLastSeen(req.auth.userId, ip).catch((err: any) => console.error('[Auth Middleware] Update Last Seen error:', err));

        next();
    });
};
