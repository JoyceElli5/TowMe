/**
 * Route Aggregator
 * Combines all routes into a single router
 */

import { Router } from 'express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import directionsRoutes from './directions.routes';
import inspectionsRoutes from './inspections.routes';
import messagesRoutes from './messages.routes';
import operatorsRoutes from './operators.routes';
import supportRoutes from './support.routes';
import paymentsRoutes from './payments.routes';
import ratingsRoutes from './ratings.routes';
import requestsRoutes from './requests.routes';
import usersRoutes from './users.routes';

const router = Router();

// Mount routes
router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/operators', operatorsRoutes);
router.use('/requests', requestsRoutes);
router.use('/ratings', ratingsRoutes);
router.use('/inspections', inspectionsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/pricing', paymentsRoutes); // Alias for pricing/estimate
router.use('/directions', directionsRoutes);
router.use('/messages', messagesRoutes);
router.use('/support', supportRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'TowMe API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
