import { Router } from 'express';
import { aiConciergeController } from './ai-concierge.controller.js';

const router = Router();

// Public AI Concierge recommendations
router.post('/recommend', aiConciergeController.getRecommendations);
router.post('/parse', aiConciergeController.parsePromptOnly);

export default router;
