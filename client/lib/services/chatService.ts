import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import api from '../api/client';

export interface Message {
    id: string;
    requestId: string;
    senderId: string;
    receiverId: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}

export interface SendMessageData {
    requestId: string;
    receiverId: string;
    content: string;
}

/**
 * Fetch messages for a specific towing request
 */
export async function getMessagesByRequest(requestId: string): Promise<Message[]> {
    try {
        const response = await api.get<any[]>(`/messages/request/${requestId}`);
        if (response.data) {
            return response.data.map(m => ({
                id: m.id,
                requestId: m.request_id || m.requestId,
                senderId: m.sender_id || m.senderId,
                receiverId: m.receiver_id || m.receiverId,
                content: m.content,
                isRead: m.is_read || m.isRead || false,
                createdAt: m.created_at || m.createdAt,
            }));
        }
    } catch (error) {
        console.warn('Backend messages API failed, falling back to Supabase direct query:', error);

        // Fallback to direct Supabase query if backend is not ready
        const { data: messages, error: sbError } = await supabase
            .from('messages')
            .select('*')
            .eq('request_id', requestId)
            .order('created_at', { ascending: true });

        if (sbError) {
            console.error('Supabase fallback also failed:', sbError);
            return [];
        }

        return (messages || []).map(m => ({
            id: m.id,
            requestId: m.request_id,
            senderId: m.sender_id,
            receiverId: m.receiver_id,
            content: m.content,
            isRead: m.is_read || false,
            createdAt: m.created_at,
        }));
    }
    return [];
}

/**
 * Send a new message
 */
export async function sendMessage(data: SendMessageData): Promise<Message> {
    try {
        const response = await api.post<any>('/messages', data);
        if (response.data) {
            const m = response.data;
            return {
                id: m.id,
                requestId: m.request_id || m.requestId,
                senderId: m.sender_id || m.senderId,
                receiverId: m.receiver_id || m.receiverId,
                content: m.content,
                isRead: m.is_read || m.isRead || false,
                createdAt: m.created_at || m.createdAt,
            };
        }
    } catch (error) {
        console.warn('Backend send message API failed, falling back to Supabase direct insert:', error);

        // Get current user for senderId
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: message, error: sbError } = await supabase
            .from('messages')
            .insert({
                request_id: data.requestId,
                sender_id: user.id,
                receiver_id: data.receiverId,
                content: data.content,
                is_read: false,
            })
            .select()
            .single();

        if (sbError) {
            console.error('Supabase send fallback also failed:', sbError);
            throw new Error(sbError.message || 'Failed to send message');
        }

        return {
            id: message.id,
            requestId: message.request_id,
            senderId: message.sender_id,
            receiverId: message.receiver_id,
            content: message.content,
            isRead: message.is_read || false,
            createdAt: message.created_at,
        };
    }
    throw new Error('Failed to send message');
}

/**
 * Mark all messages in a request as read
 */
export async function markMessagesAsRead(requestId: string): Promise<void> {
    try {
        await api.patch(`/messages/request/${requestId}/read`);
    } catch (error) {
        console.warn('Backend mark as read API failed, falling back to Supabase direct update:', error);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('request_id', requestId)
            .eq('receiver_id', user.id);
    }
}

/**
 * Subscribe to new messages for a specific request
 */
export function subscribeToMessages(
    requestId: string,
    callback: (message: Message) => void
): RealtimeChannel {
    const channel = supabase
        .channel(`chat:${requestId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `request_id=eq.${requestId}`,
            },
            (payload) => {
                const newMessage = payload.new as any;
                // Map snake_case from DB to camelCase for UI
                callback({
                    id: newMessage.id,
                    requestId: newMessage.request_id,
                    senderId: newMessage.sender_id,
                    receiverId: newMessage.receiver_id,
                    content: newMessage.content,
                    isRead: newMessage.is_read || false,
                    createdAt: newMessage.created_at,
                });
            }
        )
        .subscribe();

    return channel;
}

/**
 * Unsubscribe from a message channel
 */
export function unsubscribeFromMessages(channel: RealtimeChannel): void {
    supabase.removeChannel(channel);
}
