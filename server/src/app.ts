import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api'; // Keep for legacy/payment routes during transition
import userRoutes from './routes/userRoutes';
import documentRoutes from './routes/documentRoutes';
import path from 'path';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import stripeWebhook from './routes/webhook_stripe';
import clerkWebhook from './routes/webhook_clerk';
// Rename Transmittal (Emergency Route - Moved from api.ts due to 404)
import { query } from './db';

const app = express();
const PORT = process.env.PORT || 3000;

import { securityMiddleware } from './middleware/security';

// Security Middleware
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5177', 'https://transmit.ai', 'https://transmit-ai.vercel.app', 'https://www.transmittal.co.uk', 'https://transmittal.co.uk'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Required to allow frontend to load images/PDFs from server
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', globalLimiter);

// Stripe Webhook (MUST be before express.json() but middleware is now inside the router)
app.use('/api/webhooks/stripe', stripeWebhook);

// Clerk Webhook (MUST be before express.json() for raw body / svix signature verification)
app.use('/api/webhooks/clerk', clerkWebhook);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Debug Logging Middleware
app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.path}`);
  next();
});

app.use(securityMiddleware);

// Modular Routes
// app.use('/api/user', userRoutes); // Masked by api.ts - removing to unify logic
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Legacy/Payment Routes (Fallback)
app.use('/api', apiRoutes);

// Health Check (Database Ping for Neon)
app.get('/health', async (req: Request, res: Response) => {
  try {
    await query('SELECT 1 as ping');
    res.status(200).json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('[Health] DB Ping failed:', err);
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// Direct Test Route (Debugging)
app.get('/api/direct-test', (req: Request, res: Response) => {
  console.log('Direct test route hit');
  res.json({ message: 'Direct route works' });
});

// Final Error Fallback for /api routes (Catch-all)
app.use('/api', (req, res) => {
  console.warn(`[Server] Unhandled API Route: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'API Route Not Found', method: req.method, path: req.path });
});

// Global Error Handler Middleware (MUST be the last middleware)
app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Restarted at', new Date().toISOString());
  });
}

export default app;
