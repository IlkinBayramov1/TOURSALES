import express from 'express';
import { companiesController } from './companies.controller.js';
import { vendorController } from '../vendor/vendor.controller.js';
import { validateCompany } from './companies.validation.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

import { requireAgencyRole } from '../../middlewares/agency-role.middleware.js';

const router = express.Router();

// İctimai tərəfdaş şirkət marşrutları (Web müştərilər üçün - Autentifikasiyasız)
router.get('/public', companiesController.getPublicCompanies);
router.get('/public/:id', companiesController.getPublicProfile);

// Bütün daxili şirkət marşrutları üçün auth tələb olunur
router.use(authMiddleware());

// Vendor-un öz profilinə aid marşrutlar (GUIDE rolunun profil məlumatlarına girişi qadağandır)
router.get('/my-profile', requireAgencyRole('OWNER', 'MANAGER', 'ACCOUNTANT'), companiesController.getMyProfile);
router.get('/my-company', requireAgencyRole('OWNER', 'MANAGER', 'ACCOUNTANT'), companiesController.getMyProfile);
router.get('/my-company/stats', requireAgencyRole('OWNER', 'MANAGER', 'ACCOUNTANT'), companiesController.getCompanyStats);
router.put('/my-profile', requireAgencyRole('OWNER', 'MANAGER', 'ACCOUNTANT'), validateCompany, companiesController.updateMyProfile);
router.put('/my-company', requireAgencyRole('OWNER', 'MANAGER', 'ACCOUNTANT'), validateCompany, companiesController.updateMyProfile);

// Təhlükəsizlik və Sessiya İdarəetməsi
router.post('/my-profile/password', companiesController.changePassword);
router.post('/change-password', companiesController.changePassword);
router.get('/my-profile/sessions', companiesController.getActiveSessions);
router.post('/my-profile/sessions/revoke-others', companiesController.revokeOtherSessions);

// SuperAdmin üçün marşrutlar
router.get('/', roleMiddleware(ROLES.SUPERADMIN), companiesController.getAll);
router.get('/export', roleMiddleware(ROLES.SUPERADMIN), companiesController.exportCompanies);
router.post('/', roleMiddleware(ROLES.SUPERADMIN), validateCompany, companiesController.create);
router.get('/:id', roleMiddleware(ROLES.SUPERADMIN), companiesController.getById);
router.patch('/:id/status', roleMiddleware(ROLES.SUPERADMIN), companiesController.updateStatus);

export default router;
