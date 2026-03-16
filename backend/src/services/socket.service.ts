/**
 * Socket.io Service
 * Manages real-time WebSocket connections for chat and live updates
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import type { UserRole } from '../types/database.types';
import logger from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: UserRole;
}

let io: SocketIOServer;

export function initializeSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        sub: string;
        role: UserRole;
      };
      (socket as AuthenticatedSocket).userId = decoded.sub;
      (socket as AuthenticatedSocket).userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authedSocket = socket as AuthenticatedSocket;
    const { userId } = authedSocket;

    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    // Each user automatically joins their personal room for direct notifications
    socket.join(`user:${userId}`);

    /** Join a chat room for a specific towing request */
    socket.on('join_chat', (requestId: string) => {
      if (typeof requestId !== 'string' || !requestId) return;
      socket.join(`chat:${requestId}`);
      logger.info(`User ${userId} joined chat:${requestId}`);
    });

    /** Leave a chat room */
    socket.on('leave_chat', (requestId: string) => {
      if (typeof requestId !== 'string' || !requestId) return;
      socket.leave(`chat:${requestId}`);
    });

    /** Typing indicators */
    socket.on('typing_start', (requestId: string) => {
      socket.to(`chat:${requestId}`).emit('user_typing', { userId, requestId });
    });

    socket.on('typing_stop', (requestId: string) => {
      socket.to(`chat:${requestId}`).emit('user_stopped_typing', { userId, requestId });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (user: ${userId}) – ${reason}`);
    });
  });

  logger.info('Socket.io initialized');
  return io;
}

/** Get the Socket.io server instance */
export function getIO(): SocketIOServer | null {
  return io ?? null;
}

/** Broadcast a new chat message to everyone in the request's chat room */
export function emitNewMessage(requestId: string, message: object): void {
  io?.to(`chat:${requestId}`).emit('new_message', message);
}

/** Send a notification event to a specific user */
export function emitNotification(userId: string, notification: object): void {
  io?.to(`user:${userId}`).emit('notification', notification);
}

/** Broadcast a request status update to both participants */
export function emitRequestUpdate(userId: string, operatorId: string | null, update: object): void {
  io?.to(`user:${userId}`).emit('request_update', update);
  if (operatorId) {
    io?.to(`user:${operatorId}`).emit('request_update', update);
  }
}
