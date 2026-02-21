import { ClerkExpressRequireAuth, StrictAuthProp } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

// Shim to add auth to Request type locally
declare global {
    namespace Express {
        interface Request extends StrictAuthProp { }
    }
}

// Custom wrapper or direct export depending on error handling needs
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (process.env.E2E_TEST === 'true' && req.headers.authorization === 'Bearer mock_token') {
        req.auth = { userId: 'test_user_123', sessionId: 'mock_session' } as any;
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
