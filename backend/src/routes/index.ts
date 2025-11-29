/**
 * Route Aggregator
 * Combines all routes into a single router
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import operatorsRoutes from './operators.routes';
import requestsRoutes from './requests.routes';
import ratingsRoutes from './ratings.routes';
import inspectionsRoutes from './inspections.routes';
import paymentsRoutes from './payments.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/operators', operatorsRoutes);
router.use('/requests', requestsRoutes);
router.use('/ratings', ratingsRoutes);
router.use('/inspections', inspectionsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/pricing', paymentsRoutes); // Alias for pricing/estimate

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
