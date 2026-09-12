import { asyncHandler } from '../../core/utils.js';
import { apiKeysService } from './apikeys.service.js';
import ApiError from '../../core/api.error.js';

class ApiKeysController {
  getKeys = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu əməliyyat üçün istifadəçinin şirkəti olmalıdır.');
    }
    const result = await apiKeysService.getKeys(req.user.companyId);
    return res.json({ status: 'success', msg: 'API açarları gətirildi', data: result });
  });

  createKey = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu əməliyyat üçün istifadəçinin şirkəti olmalıdır.');
    }
    const result = await apiKeysService.createKey(req.user.companyId, req.body);
    return res.status(201).json({ status: 'success', msg: 'API açarı uğurla yaradıldı', data: result });
  });

  revokeKey = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu əməliyyat üçün istifadəçinin şirkəti olmalıdır.');
    }
    const result = await apiKeysService.revokeKey(req.user.companyId, req.params.id);
    return res.json({ status: 'success', msg: 'API açarı ləğv edildi', data: result });
  });

  deleteKey = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu əməliyyat üçün istifadəçinin şirkəti olmalıdır.');
    }
    const result = await apiKeysService.deleteKey(req.user.companyId, req.params.id);
    return res.json({ status: 'success', msg: result.message });
  });

  getStats = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu əməliyyat üçün istifadəçinin şirkəti olmalıdır.');
    }
    const result = await apiKeysService.getStats(req.user.companyId);
    return res.json({ status: 'success', msg: 'İnteqrasiya statistikası gətirildi', data: result });
  });

  getWebhooks = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu əməliyyat üçün istifadəçinin şirkəti olmalıdır.');
    }
    const result = await apiKeysService.getWebhooks(req.user.companyId);
    return res.json({ status: 'success', msg: 'Webhooks gətirildi', data: result });
  });

  createWebhook = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu əməliyyat üçün istifadəçinin şirkəti olmalıdır.');
    }
    const result = await apiKeysService.createWebhook(req.user.companyId, req.body);
    return res.status(201).json({ status: 'success', msg: 'Webhook uğurla yaradıldı', data: result });
  });

  testWebhook = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu əməliyyat üçün istifadəçinin şirkəti olmalıdır.');
    }
    const result = await apiKeysService.testWebhook(req.user.companyId, req.params.id);
    return res.json({ status: 'success', msg: result.message, data: result.delivery });
  });

  deleteWebhook = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu əməliyyat üçün istifadəçinin şirkəti olmalıdır.');
    }
    const result = await apiKeysService.deleteWebhook(req.user.companyId, req.params.id);
    return res.json({ status: 'success', msg: result.message });
  });
}

export const apiKeysController = new ApiKeysController();
export default apiKeysController;
