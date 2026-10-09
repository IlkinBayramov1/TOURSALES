import { yieldPricingService } from './yield-pricing.service.js';

export const yieldPricingController = {
  getTourPrice: async (req, res, next) => {
    try {
      const { tourId } = req.params;
      const data = await yieldPricingService.evaluateTourDynamicPrice(tourId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  updateTourRules: async (req, res, next) => {
    try {
      const { tourId } = req.params;
      const data = await yieldPricingService.updateTourYieldRules(tourId, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getCompanyOverview: async (req, res, next) => {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const data = await yieldPricingService.getCompanyToursYieldOverview(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};
