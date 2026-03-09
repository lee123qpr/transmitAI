import { Request, Response, NextFunction } from 'express';
import { logSystemError } from '../services/adminService';
import { sendCriticalErrorAlert } from '../services/emailService';

export const errorHandler = async (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('[Global Error Catch] Unhandled Exception:', err);

    const message = err.message || 'Unknown Server Error';
    const stack = err.stack;
    const url = req.originalUrl;
    // Auth middleware might attach auth to req
    const userId = (req as any).auth?.userId || null;

    // Determine severity
    // We treat all uncaught exceptions in the middle of a request as 'error',
    // but if it looks vital (e.g. database failure), bump it to 'critical'
    let level: 'warning' | 'error' | 'critical' | 'fatal' = 'error';

    // Basic heuristic: connection errors, Neon DB falls over, webhooks fail
    if (
        message.toLowerCase().includes('connection') ||
        message.toLowerCase().includes('timeout') ||
        message.toLowerCase().includes('stripe webhook') ||
        message.toLowerCase().includes('fatal')
    ) {
        level = 'critical';
    }

    // Log to our new database table
    await logSystemError({
        level,
        source: 'backend',
        message: message,
        stackTrace: stack,
        url: url,
        userId: userId,
        metadata: {
            method: req.method,
            body: req.body,
            query: req.query,
            headers: req.headers
        }
    });

    // Fire off an email alert instantly for high severity
    if (level === 'critical') {
        await sendCriticalErrorAlert({
            message,
            source: 'backend',
            url,
            userId,
            stack
        });
    }

    // Don't leak stack traces in production to the end user
    const responsePayload: any = { error: 'Internal Server Error' };
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
        responsePayload.detail = message;
        responsePayload.stack = stack;
    }

    // Respond to the client so they aren't left hanging
    res.status(500).json(responsePayload);
};
