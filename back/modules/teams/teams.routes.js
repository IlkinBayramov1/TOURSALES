import express from 'express';
import { teamsController } from './teams.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware());

router.get('/members', teamsController.getTeamMembers);
router.post('/invite', teamsController.inviteMember);
router.put('/members/:id', teamsController.updateMember);
router.delete('/members/:id', teamsController.removeMember);
router.get('/roles', teamsController.getPermissionsMatrix);
router.get('/activity-logs', teamsController.getActivityLogs);

export default router;
