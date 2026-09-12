import { asyncHandler } from '../../core/utils.js';
import { vendorService } from './vendor.service.js';
import ApiError from '../../core/api.error.js';

class VendorController {
  getDashboardStats = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu istifadəçi hər hansı şirkətə bağlı deyil.');
    }
    const period = req.query.period || 'month';
    const result = await vendorService.getDashboardStats(req.user.companyId, period);
    return res.json({
      success: true,
      status: 'success',
      msg: 'Vendor idarəetmə paneli məlumatları uğurla gətirildi',
      data: result
    });
  });

  exportDashboard = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu istifadəçi hər hansı şirkətə bağlı deyil.');
    }
    const period = req.query.period || 'month';
    const excelBuffer = await vendorService.exportDashboardExcel(req.user.companyId, period);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="toursales_hesabat_${period}_${Date.now()}.xlsx"`
    );
    return res.status(200).send(excelBuffer);
  });
}

export const vendorController = new VendorController();
export default vendorController;
