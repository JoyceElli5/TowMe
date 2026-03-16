import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import { schemas } from '../middleware/validate.middleware';

const router = Router();

// Get conversation list with last message + unread count (protected)
router.get(
    '/conversations',
    authMiddleware,
    asyncHandler(messagesController.getConversations)
);

// Get messages for a request (protected)
router.get(
    '/request/:requestId',
    authMiddleware,
    validateParams(schemas.requestIdParam),
    asyncHandler(messagesController.getMessagesByRequest)
);

// Send a message (protected)
router.post(
    '/',
    authMiddleware,
    validateBody(schemas.sendMessage),
    asyncHandler(messagesController.sendMessage)
);

// Mark messages as read (protected)
router.patch(
    '/request/:requestId/read',
    authMiddleware,
    validateParams(schemas.requestIdParam),
    asyncHandler(messagesController.markAsRead)
);

export default router;
