/**
 * TowMe Backend Server
 * Express.js server with Supabase integration and Socket.io for real-time chat
 */

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { config, validateEnv } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { generalLimiter } from './middleware/rateLimiter';
import routes from './routes';
import { initializeSocket } from './services/socket.service';
import { startStaleRequestsCron } from './services/staleRequestsCron';
import logger from './utils/logger';

// Validate environment variables
validateEnv();

// Create Express app
const app = express();

// Security middleware - configure helmet to work with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    query: req.query,
  }, 'Incoming request');
  next();
});

// Mount API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'TowMe API',
    version: '1.0.0',
    description: 'Roadside Assistance & Towing Request API',
    documentation: '/api/health',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      operators: '/api/operators',
      requests: '/api/requests',
      ratings: '/api/ratings',
      inspections: '/api/inspections',
      payments: '/api/payments',
      pricing: '/api/pricing',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Create HTTP server and attach Socket.io
const httpServer = createServer(app);
initializeSocket(httpServer);

// Start server
const PORT = config.port;

httpServer.listen(PORT, () => {
  logger.info(`🚀 TowMe API server running on port ${PORT}`);
  logger.info(`📍 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
  logger.info(`⚡ Socket.io ready for real-time connections`);

  // Start background jobs
  startStaleRequestsCron();
});

export default app;
