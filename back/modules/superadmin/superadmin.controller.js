import { asyncHandler } from '../../core/utils.js';
import { superAdminService } from './superadmin.service.js';

class SuperAdminController {
  getDashboardStats = asyncHandler(async (req, res) => {
    const result = await superAdminService.getDashboardStats();
    return res.json({
      status: 'success',
      msg: 'SuperAdmin idarəetmə paneli məlumatları uğurla gətirildi',
      data: result
    });
  });
}

export const superAdminController = new SuperAdminController();
export default superAdminController;
