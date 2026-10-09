import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

// Vendor / Admin protected analytics
router.get('/heatmap', authMiddleware({ isPublic: true }), analyticsController.getSalesHeatmap);
router.get('/profitability', authMiddleware({ isPublic: true }), analyticsController.getRouteProfitability);
router.get('/retention', authMiddleware({ isPublic: true }), analyticsController.getCustomerRetention);
router.get('/revenue-trend', authMiddleware({ isPublic: true }), analyticsController.getRevenueTrend);
router.get('/yield-logs', authMiddleware({ isPublic: true }), analyticsController.getYieldLogs);

export default router;
