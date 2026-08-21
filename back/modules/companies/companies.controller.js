import { asyncHandler } from '../../core/utils.js';
import { companiesService } from './companies.service.js';
import ApiError from '../../core/api.error.js';

class CompaniesController {
  // Vendor metodları
  getMyProfile = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu istifadəçiyə bağlı bir şirkət profili yoxdur.');
    }
    const result = await companiesService.getCompanyProfile(req.user.companyId);
    return res.json({ status: 'success', msg: 'Şirkət profili gətirildi', data: result });
  });

  updateMyProfile = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu istifadəçiyə bağlı bir şirkət profili yoxdur.');
    }
    const result = await companiesService.updateCompanyProfile(req.user.companyId, req.body);
    return res.json({ status: 'success', msg: 'Şirkət profili yeniləndi', data: result });
  });

  // Admin metodları
  getAll = asyncHandler(async (req, res) => {
    const result = await companiesService.getAllCompanies(req.query);
    return res.json({ status: 'success', msg: 'Şirkətlər uğurla gətirildi', data: result });
  });

  getById = asyncHandler(async (req, res) => {
    const result = await companiesService.getCompanyDetails(req.params.id);
    if (!result) throw ApiError.notFound('Şirkət tapılmadı');
    return res.json({ status: 'success', msg: 'Şirkət tapıldı', data: result });
  });

  create = asyncHandler(async (req, res) => {
    const result = await companiesService.adminCreateCompany(req.body);
    return res.status(201).json({ status: 'success', msg: 'Şirkət yaradıldı', data: result });
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!status) throw ApiError.badRequest('Status daxil edilməlidir');
    const result = await companiesService.adminUpdateCompanyStatus(req.params.id, status);
    return res.json({ status: 'success', msg: 'Şirkət statusu yeniləndi', data: result });
  });

  exportCompanies = asyncHandler(async (req, res) => {
    const buffer = await companiesService.exportCompaniesToExcel(req.query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=agencies.xlsx');
    return res.send(buffer);
  });
}

export const companiesController = new CompaniesController();
export default companiesController;
