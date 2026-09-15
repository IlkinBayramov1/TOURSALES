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

  getProfile = asyncHandler(async (req, res) => {
    const profile = await usersService.getProfile(req.user.id);
    return res.json({
      status: 'success',
      msg: 'İstifadəçi profili gətirildi.',
      data: profile
    });
  });

  updateProfile = asyncHandler(async (req, res) => {
    const updated = await usersService.updateProfile(req.user.id, req.body);
    return res.json({
      status: 'success',
      msg: 'Profiliniz uğurla yeniləndi.',
      data: updated
    });
  });

  changePassword = asyncHandler(async (req, res) => {
    await usersService.changePassword(req.user.id, req.body);
    return res.json({
      status: 'success',
      msg: 'Şifrəniz uğurla dəyişdirildi.'
    });
  });

  getLoyalty = asyncHandler(async (req, res) => {
    const loyalty = await usersService.getLoyalty(req.user.id);
    return res.json({
      status: 'success',
      msg: 'Loyallıq məlumatları gətirildi.',
      data: loyalty
    });
  });

  getFavorites = asyncHandler(async (req, res) => {
    const favorites = await usersService.getFavorites(req.user.id);
    return res.json({
      status: 'success',
      msg: 'Seçilmiş turlar gətirildi.',
      data: favorites
    });
  });

  toggleFavorite = asyncHandler(async (req, res) => {
    const result = await usersService.toggleFavorite(req.user.id, req.params.tourId);
    return res.json({
      status: 'success',
      msg: 'Bəyənmə statusu yeniləndi.',
      data: result
    });
  });

  syncFavorites = asyncHandler(async (req, res) => {
    const tourIds = req.body.tourIds || [];
    const result = await usersService.syncFavorites(req.user.id, tourIds);
    return res.json({
      status: 'success',
      msg: 'Seçilmiş turlar sinxronlaşdırıldı.',
      data: result
    });
  });
}

export const usersController = new UsersController();
export default usersController;
