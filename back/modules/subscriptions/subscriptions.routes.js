import express from 'express';
import { subscriptionsController } from './subscriptions.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Bütün abunəlik və tarif idarəetməsi yalnız SuperAdmin-ə aiddir
router.use(authMiddleware());
router.use(roleMiddleware(ROLES.SUPERADMIN));

router.get('/plans', subscriptionsController.getAllPlans);
router.post('/plans', subscriptionsController.createPlan);
router.put('/plans/:id', subscriptionsController.updatePlan);

router.get('/subscribers', subscriptionsController.getSubscribers);
router.get('/subscribers/export', subscriptionsController.exportSubscribers);

export default router;
