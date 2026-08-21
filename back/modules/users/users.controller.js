import { asyncHandler } from '../../core/utils.js';
import { usersService } from './users.service.js';
import ApiError from '../../core/api.error.js';

class UsersController {
  getAllCustomers = asyncHandler(async (req, res) => {
    const customers = await usersService.getAllCustomers(req.query);
    return res.json({
      status: 'success',
      msg: 'Müştəri siyahısı uğurla gətirildi.',
      data: customers
    });
  });

  getCustomerDetails = asyncHandler(async (req, res) => {
    const customer = await usersService.getCustomerDetails(req.params.id);
    if (!customer) throw ApiError.notFound('Müştəri tapılmadı.');
    return res.json({
      status: 'success',
      msg: 'Müştəri detalları uğurla gətirildi.',
      data: customer
    });
  });

  anonymizeCustomer = asyncHandler(async (req, res) => {
    const result = await usersService.anonymizeCustomer(req.params.id);
    return res.json({
      status: 'success',
      msg: 'Müştəri məlumatları GDPR-ə uyğun olaraq uğurla anonimləşdirildi.',
      data: result
    });
  });

  anonymizeMe = asyncHandler(async (req, res) => {
    const result = await usersService.anonymizeCustomer(req.user.id);
    return res.json({
      status: 'success',
      msg: 'Profiliniz GDPR-ə uyğun olaraq uğurla anonimləşdirildi/silindi.',
      data: result
    });
  });

  exportCustomers = asyncHandler(async (req, res) => {
    const buffer = await usersService.exportCustomersToExcel(req.query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.xlsx');
    return res.send(buffer);
  });
}

export const usersController = new UsersController();
export default usersController;
