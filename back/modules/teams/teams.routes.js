import express from 'express';
import { teamsController } from './teams.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { requireAgencyRole } from '../../middlewares/agency-role.middleware.js';

const router = express.Router();

router.use(authMiddleware());

// Heyət siyahısı və İcazələr matrisi
router.get('/members', teamsController.getTeamMembers);
router.get('/roles', teamsController.getPermissionsMatrix);

// Yalnız Rəhbər və Menecer üçün əməkdaş əməliyyatları
router.post('/invite', requireAgencyRole('OWNER', 'MANAGER'), teamsController.inviteMember);
router.put('/members/:id', requireAgencyRole('OWNER', 'MANAGER'), teamsController.updateMember);
router.delete('/members/:id', requireAgencyRole('OWNER', 'MANAGER'), teamsController.removeMember);
router.post('/members/:id/reset-password', requireAgencyRole('OWNER', 'MANAGER'), teamsController.resetPassword);
router.patch('/members/:id/toggle-status', requireAgencyRole('OWNER', 'MANAGER'), teamsController.toggleStatus);

// Fəaliyyət Jurnalı (Audit Log) - Rəhbər, Menecer və Mühasib üçün
router.get('/activity-logs', requireAgencyRole('OWNER', 'MANAGER', 'ACCOUNTANT'), teamsController.getActivityLogs);

export default router;
