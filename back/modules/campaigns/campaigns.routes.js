import express from 'express';
import { campaignsController } from './campaigns.controller.js';
import { validateCampaign } from './campaigns.validation.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { requireAgencyRole } from '../../middlewares/agency-role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// İctimai kampaniya marşrutları (Web müştərilər üçün)
router.get('/active', campaignsController.getActiveCampaigns);
router.post('/validate', authMiddleware({ isPublic: true }), campaignsController.validatePromo);

// Bütün daxili kampaniya marşrutları üçün auth tələb olunur
router.use(authMiddleware());

router.get('/', requireAgencyRole('OWNER', 'MANAGER', 'ACCOUNTANT'), campaignsController.getAll);
router.get('/kpi', requireAgencyRole('OWNER', 'MANAGER', 'ACCOUNTANT'), campaignsController.getKPI);
router.post('/', roleMiddleware(ROLES.VENDOR, ROLES.SUPERADMIN), requireAgencyRole('OWNER', 'MANAGER'), validateCampaign, campaignsController.create);
router.patch('/:id/status', roleMiddleware(ROLES.VENDOR, ROLES.SUPERADMIN), requireAgencyRole('OWNER', 'MANAGER'), campaignsController.toggleStatus);
router.delete('/:id', roleMiddleware(ROLES.VENDOR, ROLES.SUPERADMIN), requireAgencyRole('OWNER', 'MANAGER'), campaignsController.delete);

export default router;
