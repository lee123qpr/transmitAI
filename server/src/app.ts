import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes/api'; // Keep for legacy/payment routes during transition
import userRoutes from './routes/userRoutes';
import documentRoutes from './routes/documentRoutes';
import path from 'path';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import stripeWebhook from './routes/webhook_stripe';
// Rename Transmittal (Emergency Route - Moved from api.ts due to 404)
import { query } from './db';

const app = express();
const PORT = process.env.PORT || 3000;

import { securityMiddleware } from './middleware/security';

// Middleware
app.use(cors());

// Stripe Webhook (MUST be before express.json())
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Debug Logging Middleware
app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.path}`);
  next();
});

app.use(securityMiddleware);

// Modular Routes
app.use('/api/user', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Legacy/Payment Routes (Fallback)
app.use('/api', apiRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Restarted at', new Date().toISOString());
  });
}

export default app;
