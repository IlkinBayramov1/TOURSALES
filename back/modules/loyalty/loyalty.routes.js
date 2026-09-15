import express from 'express';
import { loyaltyController } from './loyalty.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// İctimai təkliflər siyahısı (Qonaqlar da hədiyyə kataloqunu görə bilsin)
router.get('/offers', loyaltyController.getOffers);

// Autentifikasiya tələb edən marşrutlar
router.use(authMiddleware());

// Müştəri/İstifadəçi marşrutları
router.post('/redeem', loyaltyController.redeemOffer);
router.get('/history', loyaltyController.getMyHistory);

// SuperAdmin marşrutları
router.post('/offers', roleMiddleware(ROLES.SUPERADMIN), loyaltyController.createOffer);
router.get('/admin/history', roleMiddleware(ROLES.SUPERADMIN), loyaltyController.getAllHistory);

export default router;
