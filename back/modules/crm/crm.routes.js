import express from 'express';
import { crmController } from './crm.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

router.use(authMiddleware());

// Müştəri LTV və seqmenti (Admin və Vendor üçün)
router.get('/segment', crmController.getCustomerSegment);
router.get('/ltv', crmController.getLTV);

// Tərk edilmiş biletlərin bərpası (SuperAdmin və ya daxili cron üçün)
router.post('/cart-recovery/process', roleMiddleware(ROLES.SUPERADMIN), crmController.processCartRecovery);

export default router;
