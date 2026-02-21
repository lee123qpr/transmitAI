import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import {
    getStats, getUsers, sendUserEmail, getHealth, updateTier, updateStatus, updateNewsletter,
    listArticles, saveArticle, removeArticle, listAnnouncements, saveAnnouncement, removeAnnouncement,
    listSettings, saveSetting, listBlockedIPs, blockNewIP, unblockExistingIP, fetchLogs, listNewsletterSubscribers,
    exportUsers, exportNewsletter, sendTestWelcomeEmail, sendTestNewsletterEmail
} from '../controllers/adminController';

const router = Router();

// Protect ALL admin routes
router.use(requireAuth);
router.use(requireAdmin);

router.get('/health', getHealth);
router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/users/export', exportUsers);
router.patch('/users/:userId/tier', updateTier);
router.patch('/users/:userId/status', updateStatus);
router.patch('/users/:userId/newsletter', updateNewsletter);
router.post('/users/:userId/email', sendUserEmail);

// CMS
router.get('/articles', listArticles);
router.post('/articles', saveArticle);
router.delete('/articles/:id', removeArticle);

router.get('/announcements', listAnnouncements);
router.post('/announcements', saveAnnouncement);
router.delete('/announcements/:id', removeAnnouncement);

// Settings & Security
router.get('/settings', listSettings);
router.post('/settings', saveSetting);
router.get('/blocked-ips', listBlockedIPs);
router.post('/blocked-ips', blockNewIP);
router.delete('/blocked-ips/:ip', unblockExistingIP);
router.get('/logs', fetchLogs);
router.get('/newsletter', listNewsletterSubscribers);
router.get('/newsletter/export', exportNewsletter);

// Email Testing
router.post('/emails/test-welcome', sendTestWelcomeEmail);
router.post('/emails/test-newsletter', sendTestNewsletterEmail);

export default router;
