import express from 'express';
import { adsController } from './ads.controller.js';
import { validateAdPurchase, validateAdPackage } from './ads.validation.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { requireAgencyRole } from '../../middlewares/agency-role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// İctimai reklam marşrutları (Web müştərilər üçün - Autentifikasiyasız)
router.get('/public', adsController.getPublicAds);
router.post('/:id/click', adsController.recordClick);

// Bütün daxili idarəetmə reklam marşrutları üçün auth tələb olunur
router.use(authMiddleware());

// Paket marşrutları
router.get('/packages', adsController.getPackages);
router.post('/packages', roleMiddleware(ROLES.SUPERADMIN), validateAdPackage, adsController.createPackage);

// Reklam marşrutları
router.get('/', requireAgencyRole('OWNER', 'MANAGER', 'ACCOUNTANT'), adsController.getAds);
router.get('/kpi', requireAgencyRole('OWNER', 'MANAGER', 'ACCOUNTANT'), adsController.getKPI);
router.post('/purchase', roleMiddleware(ROLES.VENDOR, ROLES.SUPERADMIN), requireAgencyRole('OWNER', 'MANAGER'), validateAdPurchase, adsController.purchaseAd);
router.patch('/:id/status', roleMiddleware(ROLES.VENDOR, ROLES.SUPERADMIN), requireAgencyRole('OWNER', 'MANAGER'), adsController.toggleStatus);
router.delete('/:id', roleMiddleware(ROLES.VENDOR, ROLES.SUPERADMIN), requireAgencyRole('OWNER', 'MANAGER'), adsController.deleteAd);

export default router;
