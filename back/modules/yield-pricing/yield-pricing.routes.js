import { Router } from 'express';
import { yieldPricingController } from './yield-pricing.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public tour dynamic price evaluation
router.get('/tours/:tourId', yieldPricingController.getTourPrice);

// Vendor protected yield rules management
router.put('/tours/:tourId/rules', authMiddleware({ isPublic: true }), yieldPricingController.updateTourRules);
router.get('/company/overview', authMiddleware({ isPublic: true }), yieldPricingController.getCompanyOverview);

export default router;
