import { NextFunction, Request, Response } from 'express';
import * as messagesService from '../services/messages.service';

/**
 * Get messages by request ID
 */
export async function getMessagesByRequest(req: Request, res: Response, next: NextFunction) {
    try {
        const { requestId } = req.params;
        const userId = (req as any).user.id;

        const messages = await messagesService.getMessagesByRequest(requestId, userId);

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Send a message
 */
export async function sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
        const senderId = (req as any).user.id;
        const messageData = req.body;

        const message = await messagesService.sendMessage(senderId, messageData);

        res.status(201).json({
            success: true,
            data: message
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Mark messages as read
 */
export async function markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
        const { requestId } = req.params;
        const userId = (req as any).user.id;

        await messagesService.markAsRead(requestId, userId);

        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        next(error);
    }
}
