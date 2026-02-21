import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getUserProfile, updateUserProfile } from '../controllers/userController';

const router = Router();

// Apply auth middleware to all user routes
router.use(requireAuth);

router.get('/', getUserProfile);
router.put('/', updateUserProfile);

export default router;
