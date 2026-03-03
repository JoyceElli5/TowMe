import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import apiClient from '../api/client';

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
 * Fetch messages for a specific towing request.
 * Uses backend API only (app auth is backend JWT, not Supabase).
 */
export async function getMessagesByRequest(requestId: string): Promise<Message[]> {
    try {
        const response = await apiClient.get<Message[]>(`/messages/request/${requestId}`);
        const list = Array.isArray(response.data) ? response.data : (response.data as any)?.data;
        if (list?.length !== undefined) {
            return list.map((m: any) => ({
                id: m.id,
                requestId: m.request_id || m.requestId,
                senderId: m.sender_id || m.senderId,
                receiverId: m.receiver_id || m.receiverId,
                content: m.content,
                isRead: m.is_read ?? m.isRead ?? false,
                createdAt: m.created_at || m.createdAt,
            }));
        }
    } catch (error) {
        if (__DEV__) {
            console.warn('Messages API failed (ensure backend is deployed with /api/messages routes):', error);
        }
    }
    return [];
}

/**
 * Send a new message.
 * Uses backend API only (app uses backend JWT; Supabase fallback is not used).
 */
export async function sendMessage(data: SendMessageData): Promise<Message> {
    try {
        const response = await apiClient.post<any>('/messages', data);
        const m = response.data;
        if (m) {
            return {
                id: m.id,
                requestId: m.request_id || m.requestId,
                senderId: m.sender_id || m.senderId,
                receiverId: m.receiver_id || m.receiverId,
                content: m.content,
                isRead: m.is_read ?? m.isRead ?? false,
                createdAt: m.created_at || m.createdAt,
            };
        }
    } catch (err: any) {
        const status = err?.status;
        const msg = err?.message || '';
        if (status === 404 || msg.includes('not found')) {
            throw new Error('Chat is not available yet. Please update the app or try again later.');
        }
        if (status === 401) {
            throw new Error('Please sign in again to send messages.');
        }
        if (status === 0 || msg.toLowerCase().includes('network')) {
            throw new Error('Could not send message. Check your connection and try again.');
        }
        throw new Error(err?.message || 'Failed to send message.');
    }
    throw new Error('Failed to send message.');
}

/**
 * Mark all messages in a request as read
 */
export async function markMessagesAsRead(requestId: string): Promise<void> {
    try {
        await apiClient.patch(`/messages/request/${requestId}/read`);
    } catch (error) {
        // For now we just log the error; messages will still be delivered
        // and marked as read on the server when the API is available.
        if (__DEV__) {
            console.warn('Backend mark as read API failed:', error);
        }
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
