import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '../config/database';
import { createError } from '../middleware/error.middleware';
import { emitNewMessage } from './socket.service';
import { MessageResponse, SendMessageRequest } from '../types/api.types';
import { Message } from '../types/database.types';
import logger from '../utils/logger';

/**
 * Get messages for a specific request.
 * Caller must be the request owner (user_id) or assigned operator (operator_id).
 */
export async function getMessagesByRequest(requestId: string, userId: string): Promise<MessageResponse[]> {
    const supabase = getSupabaseAdmin();

    const { data: request } = await supabase
        .from('towing_requests')
        .select('user_id, operator_id')
        .eq('id', requestId)
        .single();

    if (!request) {
        throw createError.notFound('Request not found');
    }

    const isParticipant = request.user_id === userId || request.operator_id === userId;
    if (!isParticipant) {
        throw createError.forbidden('You can only view messages for your own requests');
    }

    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

    if (error) {
        logger.error('Error fetching messages:', error);
        throw createError.internal('Failed to fetch messages');
    }

    return (messages || []).map(mapMessageToResponse);
}

/**
 * Send a new message.
 * Sender and receiver must be the request's user and operator (in either order).
 */
export async function sendMessage(senderId: string, data: SendMessageRequest): Promise<MessageResponse> {
    const supabase = getSupabaseAdmin();

    const { data: request } = await supabase
        .from('towing_requests')
        .select('user_id, operator_id')
        .eq('id', data.requestId)
        .single();

    if (!request) {
        throw createError.notFound('Request not found');
    }

    const participants = [request.user_id, request.operator_id].filter(Boolean);
    if (participants.length < 2) {
        throw createError.conflict('Request has no assigned operator yet');
    }

    const senderAndReceiverOk =
        (senderId === request.user_id && data.receiverId === request.operator_id) ||
        (senderId === request.operator_id && data.receiverId === request.user_id);
    if (!senderAndReceiverOk) {
        throw createError.forbidden('You can only send messages to the other participant of this request');
    }

    const { data: message, error } = await supabase
        .from('messages')
        .insert({
            id: uuidv4(),
            request_id: data.requestId,
            sender_id: senderId,
            receiver_id: data.receiverId,
            content: data.content.trim(),
            is_read: false,
        })
        .select()
        .single();

    if (error) {
        logger.error('Error sending message:', error);
        throw createError.internal('Failed to send message');
    }

    const response = mapMessageToResponse(message);

    // Broadcast via Socket.io so connected clients get it instantly
    emitNewMessage(data.requestId, response);

    return response;
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
