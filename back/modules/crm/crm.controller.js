import { asyncHandler } from '../../core/utils.js';
import crmService from './crm.service.js';
import ApiError from '../../core/api.error.js';

class CrmController {
  getCustomerSegment = asyncHandler(async (req, res) => {
    const { email } = req.query;
    const targetEmail = email || req.user.email;
    const result = await crmService.getCustomerSegment(targetEmail);
    return res.json({
      status: 'success',
      msg: 'Müştəri seqmenti və LTV gətirildi.',
      data: result
    });
  });

  getLTV = asyncHandler(async (req, res) => {
    const { email } = req.query;
    const targetEmail = email || req.user.email;
    const result = await crmService.calculateLTV(targetEmail);
    return res.json({
      status: 'success',
      msg: 'Müştəri LTV statistikası gətirildi.',
      data: result
    });
  });

  processCartRecovery = asyncHandler(async (req, res) => {
    const result = await crmService.processCartRecovery();
    return res.json({
      status: 'success',
      msg: 'Tərk edilmiş biletlərin bərpası (Cart Recovery) avtomatlaşdırılması icra edildi.',
      data: result
    });
  });
}

export const crmController = new CrmController();
export default crmController;
