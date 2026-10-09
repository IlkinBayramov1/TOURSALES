import { analyticsService } from './analytics.service.js';

export const analyticsController = {
  getSalesHeatmap: async (req, res, next) => {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const period = req.query.period || 'ALL';
      const data = await analyticsService.getSalesHeatmap(companyId, period);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getRouteProfitability: async (req, res, next) => {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const period = req.query.period || 'ALL';
      const data = await analyticsService.getRouteProfitability(companyId, period);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getCustomerRetention: async (req, res, next) => {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const period = req.query.period || 'ALL';
      const data = await analyticsService.getCustomerRetention(companyId, period);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getRevenueTrend: async (req, res, next) => {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const period = req.query.period || '30D';
      const data = await analyticsService.getRevenueTrend(companyId, period);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getYieldLogs: async (req, res, next) => {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const limit = Number(req.query.limit) || 50;
      const data = await analyticsService.getYieldLogs(companyId, limit);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};
