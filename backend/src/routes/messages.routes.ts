import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Get messages for a request (protected)
router.get(
    '/request/:requestId',
    authMiddleware,
    asyncHandler(messagesController.getMessagesByRequest)
);

// Send a message (protected)
router.post(
    '/',
    authMiddleware,
    asyncHandler(messagesController.sendMessage)
);

// Mark messages as read (protected)
router.patch(
    '/request/:requestId/read',
    authMiddleware,
    asyncHandler(messagesController.markAsRead)
);

export default router;
