import express from 'express';
import { usersController } from './users.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

router.use(authMiddleware());

// Müştərinin özünü anonimləşdirməsi (silməsi)
router.post('/me/anonymize', usersController.anonymizeMe);

// SuperAdmin üçün nəzərdə tutulmuş müştəri siyahısı, detalları və admin-tərəfli silmə
router.get('/', roleMiddleware(ROLES.SUPERADMIN), usersController.getAllCustomers);
router.get('/export', roleMiddleware(ROLES.SUPERADMIN), usersController.exportCustomers);
router.get('/:id', roleMiddleware(ROLES.SUPERADMIN), usersController.getCustomerDetails);
router.post('/:id/anonymize', roleMiddleware(ROLES.SUPERADMIN), usersController.anonymizeCustomer);

export default router;
