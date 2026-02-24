import { Router, Request, Response } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { extractDocumentData } from '../services/aiService';
import { createUser, getUser, updateUser, checkLimit, incrementUsage, updateUserTier, getActualDocumentCount, syncUsage } from '../services/userService';
import { query } from '../db';
import paymentRoutes from './payments';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/auth'; // Import Auth Middleware
import { sendWelcomeNewsletter, sendWelcomeUser } from '../services/emailService';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Rate limiter for upload endpoint
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many upload requests from this IP, please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Mount Payment Routes (Payments might need their own webhook handling without auth, but checkout sessions need auth)
// For now, assuming payment routes handle their own specific auth/webhooks or are public callback endpoints
router.use('/', paymentRoutes);

// =========================================================================
// PUBLIC ROUTES
// =========================================================================

// Health/Test endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// System Config & Announcements
import { getSystemSettings } from '../services/adminService';
import { getAnnouncements } from '../services/cmsService';

router.get('/config', async (req, res) => {
    try {
        const settings = await getSystemSettings();
        const maintenance = settings.find(s => s.key === 'maintenance_mode')?.value === true;
        res.json({ maintenanceMode: maintenance });
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.get('/announcements', async (req, res) => {
    try {
        const list = await getAnnouncements();
        res.json(list.filter(a => a.active));
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

// Articles
import { getArticles, getArticleBySlug } from '../services/cmsService';

// Newsletter
router.post('/newsletter/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    try {
        await query('INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING', [email]);

        // Send welcome email (asynchronous, don't block response)
        sendWelcomeNewsletter(email).catch(err => console.error('Welcome email failed:', err));

        res.json({ success: true });
    } catch (err) {
        console.error('Newsletter error:', err);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

router.get('/articles', async (req, res) => {
    try {
        const articles = await getArticles(true); // onlyPublished = true
        res.json(articles);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch articles' });
    }
});

router.get('/articles/:slug', async (req, res) => {
    try {
        const article = await getArticleBySlug(req.params.slug);
        if (!article) return res.status(404).json({ error: 'Article not found' });
        res.json(article);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch article' });
    }
});

// =========================================================================
// PROTECTED ROUTES (Require Clerk Token)
// =========================================================================

// Get Current User
router.get('/user', requireAuth, async (req: Request, res) => {
    try {
        const userId = req.auth.userId; // Securely get ID from token
        const { email } = req.query;

        console.log(`[API] Fetching user data for: ${userId}`);

        let user = await getUser(userId);

        // Auto-create user if not exists
        if (!user && email) {
            console.log(`[API] User not found, creating new user...`);
            user = await createUser(userId, String(email));
            // Send welcome email
            sendWelcomeUser(String(email)).catch(err => console.error('Welcome email failed:', err));
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get actual count to ensure the UI is 100% accurate
        const actualCount = await getActualDocumentCount(userId);

        // Background sync to heal the DB state if it drifted
        if (actualCount !== user.documents_usage) {
            syncUsage(userId).catch(err => console.error('Background sync failed:', err));
        }

        let renewalDate = null;
        if (user.subscription_tier !== 'free') {
            try {
                // Determine renewal date by looking up subscription in Stripe
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' as any });
                const searchEmail = String(email || user.email);
                const customers = await stripe.customers.list({ email: searchEmail, limit: 1 });
                if (customers.data.length > 0) {
                    const subscriptions = await stripe.subscriptions.list({
                        customer: customers.data[0].id,
                        status: 'active',
                        limit: 1
                    });
                    if (subscriptions.data.length > 0) {
                        const sub = subscriptions.data[0] as any;
                        renewalDate = sub.current_period_end * 1000; // UNIX to MS
                    }
                }
            } catch (stripeErr) {
                console.error('[API] Failed to fetch stripe subscription date:', stripeErr);
            }
        }

        res.json({
            ...user,
            documents_usage: actualCount, // Return real count to frontend
            createdAt: user.created_at, // Map DB column to frontend format
            renewalDate: renewalDate
        });
    } catch (error) {
        console.error('[API] Get User Error:', error);
        res.status(500).json({ error: 'Failed to fetch user status' });
    }
});

// Update Current User (Company Settings)
// Update Current User (Company Settings)
router.put('/user', requireAuth, async (req: Request, res) => {
    try {
        const userId = req.auth.userId;
        const { company_name, company_logo_url, email } = req.body;

        console.log(`[API] Updating settings for user: ${userId}`);

        let updatedUser = await updateUser(userId, {
            company_name,
            company_logo_url
        });

        // Auto-create/Retry logic
        if (!updatedUser && email) {
            console.log(`[API] User not found during update, creating now...`);
            try {
                const newUser = await createUser(userId, String(email));
                if (newUser) {
                    sendWelcomeUser(String(email)).catch(err => console.error('Welcome email failed:', err));
                }
            } catch (createError: any) {
                if (createError.code !== '23505') console.error('[API] Auto-creation failed:', createError);
            }
            updatedUser = await updateUser(userId, { company_name, company_logo_url });
        }

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found or no changes made' });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('[API] Update User Error:', error);
        res.status(500).json({ error: 'Failed to update user settings' });
    }
});

// Get User Documents
router.get('/documents', requireAuth, async (req: Request, res) => {
    try {
        const userId = req.auth.userId;

        const result = await query(
            'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        // Transform for frontend
        const documents = result.rows.map(doc => {
            let excerpt = doc.excerpt_data;
            if (typeof excerpt === 'string') {
                try { excerpt = JSON.parse(excerpt); } catch (e) { excerpt = {}; }
            }

            return {
                id: doc.id,
                filename: doc.filename,
                documentNumber: doc.doc_number,
                revision: doc.revision,
                title: doc.title,
                issueDate: doc.issue_date,
                discipline: excerpt?.discipline || 'Unknown',
                consultant: excerpt?.consultant || 'Unknown',
                status: doc.status || 'Pending',
                uploadedAt: doc.created_at,
                transmittalTitle: excerpt?.transmittalTitle,
                summary: excerpt?.summary || excerpt?.description || '',
                documentType: excerpt?.documentType || excerpt?.document_type || excerpt?.type || 'N/A',
                confidence_score: excerpt?.confidence_score,
                reasoning_notes: excerpt?.reasoning_notes
            };
        });

        console.log(`[API] Returning ${documents.length} docs with score checking`);
        res.json(documents);
    } catch (error) {
        console.error('[API] Get Documents Error:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

router.get('/debug-docs', async (req: Request, res) => {
    try {
        const result = await query('SELECT * FROM documents ORDER BY created_at DESC LIMIT 1');
        const documents = result.rows.map(doc => {
            let excerpt = doc.excerpt_data;
            if (typeof excerpt === 'string') {
                try { excerpt = JSON.parse(excerpt); } catch (e) { excerpt = {}; }
            }
            return {
                id: doc.id,
                confidence_score: excerpt?.confidence_score,
                raw_excerpt: doc.excerpt_data
            };
        });
        res.json({ deployed_at: Date.now(), data: documents });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Upload Document
router.post('/upload', requireAuth, uploadLimiter, upload.single('file'), async (req: Request, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const userId = req.auth.userId;
        const userEmail = req.body.email; // Email still sent in body for JIT creation if needed

        // 1. Ensure User Exists & Check Limits
        let user = await getUser(userId);
        if (!user && userEmail) {
            user = await createUser(userId, userEmail);
            sendWelcomeUser(userEmail).catch(err => console.error('Welcome email failed:', err));
        }

        const limitCheck = await checkLimit(userId);
        if (!limitCheck.allowed) {
            return res.status(403).json({ error: limitCheck.message });
        }

        console.log(`[API] Processing file: ${req.file.originalname} for user: ${userId}`);

        // 3. Extract Data
        let extractedData;
        try {
            extractedData = await extractDocumentData(req.file.buffer, req.file.originalname);
        } catch (extractionError) {
            console.error('[API] Extraction failed:', extractionError);
            return res.status(400).json({
                error: 'File Processing Failed',
                message: 'The file appears to be corrupt or unreadable.'
            });
        }

        if (!extractedData) {
            return res.status(422).json({ error: 'Extraction Failed', message: 'Could not extract text.' });
        }

        if (req.body.transmittalTitle) extractedData.transmittalTitle = req.body.transmittalTitle;

        // 4. Save to DB
        const docResult = await query(
            `INSERT INTO documents (
                user_id, filename, file_size, file_type, 
                doc_number, revision, title, status, issue_date, excerpt_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [
                userId,
                req.file.originalname,
                req.file.size,
                req.file.mimetype,
                extractedData.documentNumber || null,
                extractedData.revision || null,
                extractedData.title || null,
                extractedData.status || 'Pending',
                extractedData.issueDate || null,
                JSON.stringify(extractedData)
            ]
        );

        // 5. Increment Usage
        await incrementUsage(userId);

        res.json({
            message: 'File processed successfully',
            filename: req.file.originalname,
            data: extractedData,
            usage: {
                current: (user?.documents_usage || 0) + 1,
                limit: user?.documents_limit || 10
            }
        });

    } catch (error) {
        console.error('[API] Upload processing error:', error);
        res.status(500).json({ error: 'Failed to process document', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Delete Document
router.delete('/documents/:id', requireAuth, async (req: Request, res) => {
    try {
        const { id } = req.params;
        const userId = req.auth.userId;

        const result = await query(
            'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Document not found or unauthorized' });
        }

        res.json({ success: true, id });
    } catch (error) {
        console.error('[API] Delete Document Error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

// Delete Transmittal (Bulk)
router.delete('/transmittals', requireAuth, async (req: Request, res) => {
    try {
        const { title } = req.body;
        const userId = req.auth.userId;

        if (!title) return res.status(400).json({ error: 'Missing title' });

        const titleQuery = title === 'Unsorted Uploads' ? null : title;
        let result;

        if (titleQuery) {
            result = await query(
                `DELETE FROM documents 
                 WHERE user_id = $1 
                 AND (
                    excerpt_data->>'transmittalTitle' = $2 
                    OR title = $2
                    OR (excerpt_data->>'transmittalTitle' IS NULL AND title IS NULL AND $2 = 'Unsorted Uploads')
                 )`,
                [userId, titleQuery]
            );
        } else {
            result = await query(
                `DELETE FROM documents 
                 WHERE user_id = $1 
                 AND (excerpt_data->>'transmittalTitle' IS NULL OR excerpt_data->>'transmittalTitle' = '')`,
                [userId]
            );
        }

        res.json({ success: true, count: result.rowCount });
    } catch (error) {
        console.error('[API] Delete Transmittal Error:', error);
        res.status(500).json({ error: 'Failed to delete transmittal' });
    }
});

// Rename Transmittal (Bulk)
router.put('/transmittals/rename', requireAuth, async (req: Request, res) => {
    try {
        const { oldTitle, newTitle } = req.body;
        const userId = req.auth.userId;

        if (!newTitle) return res.status(400).json({ error: 'Missing new title' });

        const titleQuery = oldTitle === 'Unsorted Uploads' ? null : oldTitle;

        // 1. Fetch matching documents
        let result;
        if (titleQuery) {
            result = await query(
                `SELECT id, excerpt_data FROM documents 
                 WHERE user_id = $1 
                 AND (
                    excerpt_data->>'transmittalTitle' = $2 
                    OR title = $2
                 )`,
                [userId, titleQuery]
            );
        } else {
            result = await query(
                `SELECT id, excerpt_data FROM documents 
                 WHERE user_id = $1 
                 AND (excerpt_data->>'transmittalTitle' IS NULL OR excerpt_data->>'transmittalTitle' = '')`,
                [userId]
            );
        }

        if (result.rowCount === 0) {
            return res.json({ success: true, count: 0 });
        }

        // 2. Loop and update each one's excerpt_data safely
        let updateCount = 0;
        for (const doc of result.rows) {
            let excerpt = doc.excerpt_data;
            if (typeof excerpt === 'string') {
                try { excerpt = JSON.parse(excerpt); } catch (e) { excerpt = {}; }
            } else if (!excerpt) {
                excerpt = {};
            }

            // Update the transmittalTitle inside the JSON
            excerpt.transmittalTitle = newTitle;

            await query(
                'UPDATE documents SET excerpt_data = $1 WHERE id = $2 AND user_id = $3',
                [JSON.stringify(excerpt), doc.id, userId]
            );
            updateCount++;
        }

        res.json({ success: true, count: updateCount });
    } catch (error) {
        console.error('[API] Rename Transmittal Error:', error);
        res.status(500).json({ error: 'Failed to rename transmittal' });
    }
});

export default router;


