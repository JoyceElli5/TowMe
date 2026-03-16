/**
 * Socket.io Client Service
 * Manages the WebSocket connection to the TowMe backend for real-time chat
 */

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../api/client';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:3001/api')
  .replace('/api', '');

let socket: Socket | null = null;
let currentToken: string | null = null;

/**
 * Connect to the socket server with the current JWT token.
 * Safe to call multiple times – reconnects only when necessary.
 */
export async function connectSocket(): Promise<Socket> {
  const token = await getAccessToken();

  // Reuse existing connected socket if token hasn't changed
  if (socket?.connected && token === currentToken) {
    return socket;
  }

  // Disconnect stale socket if present
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  if (!token) {
    throw new Error('No access token – cannot connect to socket');
  }

  currentToken = token;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    if (__DEV__) console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    if (__DEV__) console.warn('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    if (__DEV__) console.log('[Socket] Disconnected:', reason);
  });

  return socket;
}

/** Disconnect and clean up the socket */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}

/** Get the current socket instance (may be null if not connected) */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Subscribe to new messages in a chat room (towing request).
 * Returns an unsubscribe function.
 */
export async function subscribeToChat(
  requestId: string,
  onMessage: (message: any) => void
): Promise<() => void> {
  const s = await connectSocket();

  s.emit('join_chat', requestId);
  s.on('new_message', onMessage);

  return () => {
    s.emit('leave_chat', requestId);
    s.off('new_message', onMessage);
  };
}

/** Emit a typing start event */
export function emitTypingStart(requestId: string): void {
  socket?.emit('typing_start', requestId);
}

/** Emit a typing stop event */
export function emitTypingStop(requestId: string): void {
  socket?.emit('typing_stop', requestId);
}

/**
 * Subscribe to typing indicators for a request.
 * Returns an unsubscribe function.
 */
export function subscribeToTyping(
  onTyping: (data: { userId: string; requestId: string }) => void,
  onStopTyping: (data: { userId: string; requestId: string }) => void
): () => void {
  if (!socket) return () => {};

  socket.on('user_typing', onTyping);
  socket.on('user_stopped_typing', onStopTyping);

  return () => {
    socket?.off('user_typing', onTyping);
    socket?.off('user_stopped_typing', onStopTyping);
  };
}
