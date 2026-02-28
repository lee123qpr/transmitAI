import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth';
import { getDocuments, uploadDocument, deleteDocument, deleteTransmittal } from '../controllers/documentController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Rate limiter for upload endpoint
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many upload requests. Please wait a few minutes before uploading more.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply auth middleware to all document routes
router.use(requireAuth);

router.get('/', getDocuments);
router.post('/upload', uploadLimiter, upload.single('file'), uploadDocument);
router.delete('/:id', deleteDocument);
router.delete('/transmittals', deleteTransmittal); // Bulk delete

export default router;
