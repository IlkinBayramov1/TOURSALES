import express from 'express';
import { adsController } from './ads.controller.js';
import { validateAdPurchase, validateAdPackage } from './ads.validation.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Bütün reklam marşrutları üçün auth tələb olunur
router.use(authMiddleware());

// Paket marşrutları
router.get('/packages', adsController.getPackages);
router.post('/packages', roleMiddleware(ROLES.SUPERADMIN), validateAdPackage, adsController.createPackage);

// Reklam marşrutları
router.get('/', adsController.getAds);
router.get('/kpi', adsController.getKPI);
router.post('/purchase', roleMiddleware(ROLES.VENDOR), validateAdPurchase, adsController.purchaseAd);
router.patch('/:id/status', roleMiddleware(ROLES.VENDOR), adsController.toggleStatus);
router.delete('/:id', roleMiddleware(ROLES.VENDOR), adsController.deleteAd);

export default router;
