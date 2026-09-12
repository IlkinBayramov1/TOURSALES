import express from 'express';
import { companiesController } from './companies.controller.js';
import { vendorController } from '../vendor/vendor.controller.js';
import { validateCompany } from './companies.validation.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Bütün şirkət marşrutları üçün auth tələb olunur
router.use(authMiddleware());

// Vendor-un öz profilinə aid marşrutlar
router.get('/my-profile', companiesController.getMyProfile);
router.get('/my-company', companiesController.getMyProfile);
router.get('/my-company/stats', companiesController.getCompanyStats);
router.put('/my-profile', validateCompany, companiesController.updateMyProfile);
router.put('/my-company', validateCompany, companiesController.updateMyProfile);
router.post('/my-profile/password', companiesController.changePassword);
router.post('/change-password', companiesController.changePassword);

// SuperAdmin üçün marşrutlar
router.get('/', roleMiddleware(ROLES.SUPERADMIN), companiesController.getAll);
router.get('/export', roleMiddleware(ROLES.SUPERADMIN), companiesController.exportCompanies);
router.post('/', roleMiddleware(ROLES.SUPERADMIN), validateCompany, companiesController.create);
router.get('/:id', roleMiddleware(ROLES.SUPERADMIN), companiesController.getById);
router.patch('/:id/status', roleMiddleware(ROLES.SUPERADMIN), companiesController.updateStatus);

export default router;
