import express from 'express';
import { subscriptionsController } from './subscriptions.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Bütün abunəlik marşrutları üçün auth vacibdir
router.use(authMiddleware());

// Vendor və Ümumi Abunəlik Marşrutları
router.get('/current', subscriptionsController.getCurrentSubscription);
router.get('/plans', subscriptionsController.getAllPlans);
router.post('/change-plan', subscriptionsController.changePlan);
router.get('/payments', subscriptionsController.getBillingHistory);
router.get('/invoice/:paymentId', subscriptionsController.getInvoiceDetails);
router.patch('/auto-renewal', subscriptionsController.toggleAutoRenewal);

// SuperAdmin idarəetmə marşrutları
router.post('/plans', roleMiddleware(ROLES.SUPERADMIN), subscriptionsController.createPlan);
router.put('/plans/:id', roleMiddleware(ROLES.SUPERADMIN), subscriptionsController.updatePlan);
router.get('/subscribers', roleMiddleware(ROLES.SUPERADMIN), subscriptionsController.getSubscribers);
router.get('/subscribers/export', roleMiddleware(ROLES.SUPERADMIN), subscriptionsController.exportSubscribers);

export default router;
