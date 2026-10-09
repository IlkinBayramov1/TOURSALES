import { asyncHandler } from '../../core/utils.js';
import { campaignsService } from './campaigns.service.js';
import ApiError from '../../core/api.error.js';
import { ROLES } from '../../config/constants.js';

class CampaignsController {
  getAll = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await campaignsService.getAll(req.query, companyId);
    return res.json({ status: 'success', msg: 'Kampaniyalar uğurla gətirildi', data: result });
  });

  getById = asyncHandler(async (req, res) => {
    const result = await campaignsService.getById(req.params.id);
    if (!result) throw ApiError.notFound('Kampaniya tapılmadı');
    return res.json({ status: 'success', msg: 'Kampaniya tapıldı', data: result });
  });

  create = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await campaignsService.create(req.body, companyId, req.user);
    return res.status(201).json({ status: 'success', msg: 'Kampaniya yaradıldı', data: result });
  });

  toggleStatus = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await campaignsService.toggleStatus(req.params.id, companyId, req.user);
    return res.json({ status: 'success', msg: 'Kampaniya statusu dəyişdirildi', data: result });
  });

  delete = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await campaignsService.delete(req.params.id, companyId, req.user);
    if (!result) throw ApiError.notFound('Kampaniya tapılmadı və ya silməyə icazəniz yoxdur.');
    return res.json({ status: 'success', msg: 'Kampaniya silindi' });
  });

  validatePromo = asyncHandler(async (req, res) => {
    const code = req.body.promoCode || req.body.code;
    if (!code) throw ApiError.badRequest('Promokod daxil edilməlidir.');
    const userId = req.user ? req.user.id : null;
    const result = await campaignsService.validatePromoCode(code, userId);
    return res.json({ status: 'success', msg: 'Promokod etibarlıdır.', data: result });
  });

  getActiveCampaigns = asyncHandler(async (req, res) => {
    const result = await campaignsService.getActiveCampaigns();
    return res.json({ status: 'success', msg: 'Aktiv kampaniyalar gətirildi', data: result });
  });

  getKPI = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await campaignsService.getKPIReport(companyId);
    return res.json({ status: 'success', msg: 'Kampaniya göstəriciləri (KPI) hesabatı gətirildi', data: result });
  });
}

export const campaignsController = new CampaignsController();
export default campaignsController;
