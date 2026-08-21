import express from 'express';
import { campaignsController } from './campaigns.controller.js';
import { validateCampaign } from './campaigns.validation.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = express.Router();

// Bütün kampaniya marşrutları üçün auth tələb olunur
router.use(authMiddleware());

router.get('/', campaignsController.getAll);
router.get('/kpi', campaignsController.getKPI);
router.post('/validate', campaignsController.validatePromo);
router.post('/', validateCampaign, campaignsController.create);
router.delete('/:id', campaignsController.delete);

export default router;
