import express from 'express';
import { apiKeysController } from './apikeys.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { requireAgencyRole } from '../../middlewares/agency-role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Bütün API açar marşrutları üçün auth tələb olunur
router.use(authMiddleware());
router.use(roleMiddleware(ROLES.VENDOR, ROLES.SUPERADMIN));

// Stats
router.get('/stats', requireAgencyRole('OWNER', 'MANAGER', 'ACCOUNTANT'), apiKeysController.getStats);

// Keys CRUD & Əməliyyatlar
router.get('/', requireAgencyRole('OWNER', 'MANAGER', 'ACCOUNTANT'), apiKeysController.getKeys);
router.post('/', requireAgencyRole('OWNER', 'MANAGER'), apiKeysController.createKey);
router.patch('/:id', requireAgencyRole('OWNER', 'MANAGER'), apiKeysController.updateKey);
router.patch('/:id/revoke', requireAgencyRole('OWNER', 'MANAGER'), apiKeysController.revokeKey);
router.post('/:id/regenerate', requireAgencyRole('OWNER', 'MANAGER'), apiKeysController.regenerateKey);
router.delete('/:id', requireAgencyRole('OWNER', 'MANAGER'), apiKeysController.deleteKey);

// Canlı API Test & Simulyasiya Sorğusu
router.post('/simulate', requireAgencyRole('OWNER', 'MANAGER'), apiKeysController.simulateRequest);

// Webhooks CRUD & Sınaq
router.get('/webhooks/all', requireAgencyRole('OWNER', 'MANAGER', 'ACCOUNTANT'), apiKeysController.getWebhooks);
router.post('/webhooks', requireAgencyRole('OWNER', 'MANAGER'), apiKeysController.createWebhook);
router.patch('/webhooks/:id', requireAgencyRole('OWNER', 'MANAGER'), apiKeysController.updateWebhook);
router.post('/webhooks/:id/test', requireAgencyRole('OWNER', 'MANAGER'), apiKeysController.testWebhook);
router.delete('/webhooks/:id', requireAgencyRole('OWNER', 'MANAGER'), apiKeysController.deleteWebhook);

export default router;
