import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '../config/database';
import { createError } from '../middleware/error.middleware';
import { MessageResponse, SendMessageRequest } from '../types/api.types';
import { Message } from '../types/database.types';
import logger from '../utils/logger';

/**
 * Get messages for a specific request
 */
export async function getMessagesByRequest(requestId: string, userId: string): Promise<MessageResponse[]> {
    const supabase = getSupabaseAdmin();

    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', requestId)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true });

    if (error) {
        logger.error('Error fetching messages:', error);
        throw createError.internal('Failed to fetch messages');
    }

    return (messages || []).map(mapMessageToResponse);
}

/**
 * Send a new message
 */
export async function sendMessage(senderId: string, data: SendMessageRequest): Promise<MessageResponse> {
    const supabase = getSupabaseAdmin();

    const { data: message, error } = await supabase
        .from('messages')
        .insert({
            id: uuidv4(),
            request_id: data.requestId,
            sender_id: senderId,
            receiver_id: data.receiverId,
            content: data.content,
            is_read: false,
        })
        .select()
        .single();

    if (error) {
        logger.error('Error sending message:', error);
        throw createError.internal('Failed to send message');
    }

    return mapMessageToResponse(message);
}

/**
 * Mark messages as read
 */
export async function markAsRead(requestId: string, userId: string): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('request_id', requestId)
        .eq('receiver_id', userId);

    if (error) {
        logger.error('Error marking messages as read:', error);
        throw createError.internal('Failed to update message status');
    }
}

/**
 * Map database message to response format
 */
function mapMessageToResponse(message: Message): MessageResponse {
    return {
        id: message.id,
        requestId: message.request_id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        content: message.content,
        isRead: message.is_read,
        createdAt: message.created_at,
    };
}
