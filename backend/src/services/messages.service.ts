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
        .select('user_id, operator_id, status, completed_at')
        .eq('id', requestId)
        .single();

    if (!request) {
        throw createError.notFound('Request not found');
    }

    const isParticipant = request.user_id === userId || request.operator_id === userId;
    if (!isParticipant) {
        throw createError.forbidden('You can only view messages for your own requests');
    }

    // Auto-expire messages 1 hour after trip completion
    if (request.status === 'completed' && request.completed_at) {
        const completedAt = new Date(request.completed_at).getTime();
        if (Date.now() - completedAt > 60 * 60 * 1000) {
            return [];
        }
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

export interface ConversationSummary {
    requestId: string;
    otherUserId: string;
    otherUserName: string;
    otherUserPhone: string | null;
    otherUserAvatarUrl: string | null;
    lastMessageContent: string | null;
    lastMessageAt: string | null;
    lastMessageSenderId: string | null;
    unreadCount: number;
}

/**
 * Return one summary row per request the caller participates in,
 * including the last message preview and unread count.
 */
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
    const supabase = getSupabaseAdmin();

    // 1-hour cutoff: exclude completed requests older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Fetch all requests where the user is involved (as owner or operator)
    const { data: requests, error: reqError } = await supabase
        .from('towing_requests')
        .select('id, user_id, operator_id, status, completed_at, users!towing_requests_user_id_fkey(id, full_name, phone, avatar_url), operators:users!towing_requests_operator_id_fkey(id, full_name, phone, avatar_url)')
        .or(`user_id.eq.${userId},operator_id.eq.${userId}`)
        .not('operator_id', 'is', null)
        .or(`status.neq.completed,completed_at.gt.${oneHourAgo}`)
        .order('created_at', { ascending: false });

    if (reqError || !requests || requests.length === 0) {
        return [];
    }

    // For each request, fetch last message + unread count
    const summaries = await Promise.all(
        requests.map(async (req: any) => {
            const isOwner = req.user_id === userId;
            const other = isOwner ? req.operators : req.users;
            if (!other) return null;

            // Last message
            const { data: lastMsgs } = await supabase
                .from('messages')
                .select('content, created_at, sender_id')
                .eq('request_id', req.id)
                .order('created_at', { ascending: false })
                .limit(1);

            const last = lastMsgs?.[0] ?? null;

            // Unread count (messages sent to this user that aren't read)
            const { count: unread } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('request_id', req.id)
                .eq('receiver_id', userId)
                .eq('is_read', false);

            return {
                requestId: req.id,
                otherUserId: other.id,
                otherUserName: other.full_name || 'User',
                otherUserPhone: other.phone ?? null,
                otherUserAvatarUrl: other.avatar_url ?? null,
                lastMessageContent: last?.content ?? null,
                lastMessageAt: last?.created_at ?? null,
                lastMessageSenderId: last?.sender_id ?? null,
                unreadCount: unread ?? 0,
            } satisfies ConversationSummary;
        })
    );

    return summaries.filter((s): s is ConversationSummary => s !== null);
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
