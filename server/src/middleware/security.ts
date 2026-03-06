import { Request, Response, NextFunction } from 'express';
import { isIPBlocked, getSystemSettings } from '../services/adminService';

// Simple in-memory cache to avoid DB hit on every request
let blockedIPsCache: Set<string> = new Set();
let maintenanceMode = false;
let lastUpdate = 0;
const CACHE_TTL = 30000; // 30 seconds

async function refreshCache() {
    try {
        const settings = await getSystemSettings();
        const maintenanceSetting = settings.find(s => s.key === 'maintenance_mode');
        maintenanceMode = maintenanceSetting?.value === true;

        // Note: For IPs, we might want to still check DB if not in cache, 
        // or just rely on a periodic full sync if the list is small.
        // For now, isIPBlocked service already does a DB check.
        // We'll just cache maintenance mode here for performance.

        lastUpdate = Date.now();
    } catch (err) {
        console.error('Failed to refresh security cache:', err);
    }
}

export const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '';

    // 1. IP Blocking Check
    const blocked = await isIPBlocked(ip);
    if (blocked) {
        return res.status(403).json({
            error: 'Access Denied',
            message: 'Your IP has been blocked by system administrators.'
        });
    }

    // 2. Maintenance Mode Check
    if (Date.now() - lastUpdate > CACHE_TTL) {
        await refreshCache();
    }

    if (maintenanceMode) {
        // Allow admins to bypass maintenance mode
        // Note: This requires the auth middleware to have run already, 
        // OR we check for a special header/bypass.
        // Since app.use(security) is usually before routes, 
        // we might allow /api/admin paths to bypass if they have proper auth.

        const isAdminPath = req.path.startsWith('/api/admin');
        const isHealthPath = req.path === '/health';
        const isUserPath = req.path === '/api/user';

        if (!isAdminPath && !isHealthPath && !isUserPath) {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'System is currently undergoing maintenance. Please try again later.'
            });
        }
    }

    next();
};
