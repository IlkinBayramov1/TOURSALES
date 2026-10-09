import { aiConciergeService } from './ai-concierge.service.js';

export const aiConciergeController = {
  getRecommendations: async (req, res, next) => {
    try {
      const { prompt } = req.body;
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ success: false, message: 'Zəhmət olmasa səyahət istəyinizi qeyd edin.' });
      }

      const userId = req.user?.id || null;
      const result = await aiConciergeService.getRecommendations(prompt, userId);

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  parsePromptOnly: (req, res) => {
    const { prompt } = req.body;
    const parsed = aiConciergeService.parseTravelPrompt(prompt || '');
    res.status(200).json({ success: true, data: parsed });
  },
};
