import apiClient from '../api/client';
import { subscribeToChat } from './socketService';

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
 * Fetch all messages for a towing request via the REST API.
 */
export async function getMessagesByRequest(requestId: string): Promise<Message[]> {
    try {
        const response = await apiClient.get<Message[]>(`/messages/request/${requestId}`);
        const list = Array.isArray(response.data) ? response.data : (response.data as any)?.data;
        if (Array.isArray(list)) {
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
            console.warn('[Chat] getMessagesByRequest failed:', error);
        }
    }
    return [];
}

/**
 * Send a message via the REST API.
 * The backend will broadcast it over Socket.io after saving.
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
            throw new Error('Chat is not available yet. Please try again later.');
        }
        if (status === 401) {
            throw new Error('Please sign in again to send messages.');
        }
        if (status === 0 || msg.toLowerCase().includes('network')) {
            throw new Error('No connection. Check your internet and try again.');
        }
        throw new Error(err?.message || 'Failed to send message.');
    }
    throw new Error('Failed to send message.');
}

/**
 * Mark all messages in a request as read (for the current user).
 */
export async function markMessagesAsRead(requestId: string): Promise<void> {
    try {
        await apiClient.patch(`/messages/request/${requestId}/read`);
    } catch (error) {
        if (__DEV__) {
            console.warn('[Chat] markMessagesAsRead failed:', error);
        }
    }
}

/**
 * Subscribe to real-time messages via Socket.io.
 * Returns a function that, when called, unsubscribes and leaves the room.
 */
export async function subscribeToMessages(
    requestId: string,
    callback: (message: Message) => void
): Promise<() => void> {
    const unsubscribe = await subscribeToChat(requestId, (raw: any) => {
        const msg: Message = {
            id: raw.id,
            requestId: raw.requestId || raw.request_id,
            senderId: raw.senderId || raw.sender_id,
            receiverId: raw.receiverId || raw.receiver_id,
            content: raw.content,
            isRead: raw.isRead ?? raw.is_read ?? false,
            createdAt: raw.createdAt || raw.created_at,
        };
        callback(msg);
    });
    return unsubscribe;
}
