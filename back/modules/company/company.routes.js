import express from 'express';
import { companyController } from './company.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

router.use(authMiddleware());

// Rollar və İcazələr matrisi
router.get('/rbac/roles-permissions', companyController.getRolesAndPermissions);

// B2B Partnyor API Açarları
router.post('/api-keys', roleMiddleware(ROLES.VENDOR), companyController.generateApiKey);
router.get('/api-keys', roleMiddleware(ROLES.VENDOR), companyController.getApiKeys);

// Agentlik komanda idarəetməsi
router.post('/team/members', roleMiddleware(ROLES.VENDOR), companyController.addTeamMember);
router.get('/team/members', roleMiddleware(ROLES.VENDOR), companyController.getTeamMembers);

export default router;
