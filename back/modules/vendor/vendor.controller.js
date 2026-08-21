import { asyncHandler } from '../../core/utils.js';
import { vendorService } from './vendor.service.js';
import ApiError from '../../core/api.error.js';

class VendorController {
  getDashboardStats = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu istifadəçi hər hansı şirkətə bağlı deyil.');
    }
    const result = await vendorService.getDashboardStats(req.user.companyId);
    return res.json({
      status: 'success',
      msg: 'Vendor idarəetmə paneli məlumatları uğurla gətirildi',
      data: result
    });
  });
}

export const vendorController = new VendorController();
export default vendorController;
