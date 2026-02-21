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
// Rename Transmittal (Emergency Route - Moved from api.ts due to 404)
import { query } from './db';

const app = express();
const PORT = process.env.PORT || 3000;

import { securityMiddleware } from './middleware/security';

// Middleware
app.use(cors());
app.use(express.json());
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Restarted at', new Date().toISOString());
});
