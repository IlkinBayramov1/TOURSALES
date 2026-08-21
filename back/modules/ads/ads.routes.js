import express from 'express';
import { adsController } from './ads.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Bütün reklam marşrutları üçün auth lazımdır
router.use(authMiddleware());

// Paket marşrutları
router.get('/packages', adsController.getPackages);
router.post('/packages', roleMiddleware(ROLES.SUPERADMIN), adsController.createPackage);

// Reklam marşrutları
router.post('/purchase', roleMiddleware(ROLES.VENDOR), adsController.purchaseAd);
router.get('/', adsController.getAds);
router.get('/kpi', adsController.getKPI);

export default router;
