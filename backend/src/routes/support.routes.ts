import { Router } from 'express';
import { sendSupportMessage } from '../controllers/support.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/contact', authMiddleware, sendSupportMessage);

export default router;
