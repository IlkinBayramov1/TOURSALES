import express from 'express';
import { superAdminController } from './superadmin.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Bütün superadmin marşrutları üçün auth və SuperAdmin rolu vacibdir
router.use(authMiddleware());
router.use(roleMiddleware(ROLES.SUPERADMIN));

router.get('/dashboard', superAdminController.getDashboardStats);
router.get('/dashboard/stats', superAdminController.getDashboardStats);
router.get('/stats', superAdminController.getDashboardStats);
router.get('/', superAdminController.getDashboardStats);

export default router;
