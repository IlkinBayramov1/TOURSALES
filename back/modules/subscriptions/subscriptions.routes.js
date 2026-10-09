import express from 'express';
import { subscriptionsController } from './subscriptions.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

import { requireAgencyRole } from '../../middlewares/agency-role.middleware.js';

const router = express.Router();

// Bütün abunəlik marşrutları üçün auth vacibdir
router.use(authMiddleware());

// Vendor və Ümumi Abunəlik Marşrutları
router.get('/current', subscriptionsController.getCurrentSubscription);
router.get('/plans', subscriptionsController.getAllPlans);
router.post('/change-plan', requireAgencyRole('OWNER'), subscriptionsController.changePlan);
router.get('/payments', subscriptionsController.getBillingHistory);
router.get('/invoice/:paymentId', subscriptionsController.getInvoiceDetails);
router.patch('/auto-renewal', requireAgencyRole('OWNER'), subscriptionsController.toggleAutoRenewal);

// SuperAdmin idarəetmə marşrutları
router.post('/plans', roleMiddleware(ROLES.SUPERADMIN), subscriptionsController.createPlan);
router.put('/plans/:id', roleMiddleware(ROLES.SUPERADMIN), subscriptionsController.updatePlan);
router.get('/subscribers', roleMiddleware(ROLES.SUPERADMIN), subscriptionsController.getSubscribers);
router.get('/subscribers/export', roleMiddleware(ROLES.SUPERADMIN), subscriptionsController.exportSubscribers);
router.post('/renewals/trigger', roleMiddleware(ROLES.SUPERADMIN), subscriptionsController.triggerAutoRenewals);

export default router;
