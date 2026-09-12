import { asyncHandler } from '../../core/utils.js';
import { adsService } from './ads.service.js';
import ApiError from '../../core/api.error.js';
import { ROLES } from '../../config/constants.js';

class AdsController {
  getPackages = asyncHandler(async (req, res) => {
    const result = await adsService.getPackages();
    return res.json({ status: 'success', msg: 'Reklam paketləri gətirildi', data: result });
  });

  createPackage = asyncHandler(async (req, res) => {
    const result = await adsService.createPackage(req.body);
    return res.status(201).json({ status: 'success', msg: 'Reklam paketi yaradıldı', data: result });
  });

  purchaseAd = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu əməliyyat üçün istifadəçinin şirkəti olmalıdır.');
    }
    const result = await adsService.purchaseAd(req.user.companyId, req.body);
    return res.status(201).json({ status: 'success', msg: 'Reklam uğurla alındı', data: result });
  });

  getAds = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await adsService.getAds(req.query, companyId);
    return res.json({ status: 'success', msg: 'Reklamlar uğurla gətirildi', data: result });
  });

  toggleStatus = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu əməliyyat üçün istifadəçinin şirkəti olmalıdır.');
    }
    const result = await adsService.toggleAdStatus(req.user.companyId, req.params.id);
    return res.json({ status: 'success', msg: 'Reklam statusu yeniləndi', data: result });
  });

  deleteAd = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu əməliyyat üçün istifadəçinin şirkəti olmalıdır.');
    }
    const result = await adsService.deleteAd(req.user.companyId, req.params.id);
    return res.json({ status: 'success', msg: result.message });
  });

  getKPI = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await adsService.getAdsKPI(companyId);
    return res.json({ status: 'success', msg: 'Reklam KPI hesabatı gətirildi', data: result });
  });
}

export const adsController = new AdsController();
export default adsController;
