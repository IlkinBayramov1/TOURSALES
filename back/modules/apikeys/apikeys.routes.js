import express from 'express';
import { apiKeysController } from './apikeys.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Bütün API açar marşrutları vendor rəhbər / meneceri üçün auth tələb edir
router.use(authMiddleware());
router.use(roleMiddleware(ROLES.VENDOR));

// Stats
router.get('/stats', apiKeysController.getStats);

// Keys CRUD
router.get('/', apiKeysController.getKeys);
router.post('/', apiKeysController.createKey);
router.patch('/:id/revoke', apiKeysController.revokeKey);
router.delete('/:id', apiKeysController.deleteKey);

// Webhooks
router.get('/webhooks/all', apiKeysController.getWebhooks);
router.post('/webhooks', apiKeysController.createWebhook);
router.post('/webhooks/:id/test', apiKeysController.testWebhook);
router.delete('/webhooks/:id', apiKeysController.deleteWebhook);

export default router;
