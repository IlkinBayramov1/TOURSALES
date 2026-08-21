import express from 'express';
import { vendorController } from './vendor.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Bütün vendor marşrutları üçün auth və Vendor rolu vacibdir
router.use(authMiddleware());
router.use(roleMiddleware(ROLES.VENDOR));

router.get('/dashboard', vendorController.getDashboardStats);

export default router;
