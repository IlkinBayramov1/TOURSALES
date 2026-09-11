import { asyncHandler } from '../../core/utils.js';
import { toursService } from './tours.service.js';
import { seatService } from './seat.service.js';
import { pricingEngine } from './pricing.engine.js';
import ApiError from '../../core/api.error.js';
import { ROLES } from '../../config/constants.js';

class ToursController {
  // Vendor metodları
  getMyTours = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu istifadəçi hər hansı şirkətə bağlı deyil.');
    }
    const result = await toursService.getAll(req.query, req.user.companyId);
    return res.json({ status: 'success', msg: 'Şirkətinizin turları gətirildi', data: result });
  });

  getMyPerformanceStats = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu istifadəçi hər hansı şirkətə bağlı deyil.');
    }
    const result = await toursService.getPerformanceStats(req.user.companyId);
    return res.json({ status: 'success', msg: 'Şirkət turlarının satış göstəriciləri gətirildi', data: result });
  });

  create = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Yalnız şirkəti olan vendorlar tur yarada bilər.');
    }
    const result = await toursService.create(req.body, req.user.companyId);
    return res.status(201).json({ status: 'success', msg: 'Tur uğurla yaradıldı', data: result });
  });

  update = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await toursService.update(req.params.id, req.body, companyId);
    if (!result) throw ApiError.notFound('Tur tapılmadı və ya redaktə etməyə icazəniz yoxdur.');
    return res.json({ status: 'success', msg: 'Tur yeniləndi', data: result });
  });

  delete = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await toursService.delete(req.params.id, companyId);
    if (!result) throw ApiError.notFound('Tur tapılmadı və ya silməyə icazəniz yoxdur.');
    return res.json({ status: 'success', msg: 'Tur silindi' });
  });

  // Gözləmə Siyahısı metodları
  joinWaitingList = asyncHandler(async (req, res) => {
    const result = await toursService.joinWaitingList(req.params.id, req.user.id);
    return res.status(201).json({
      status: 'success',
      msg: 'Uğurla bu turun gözləmə siyahısına yazıldınız.',
      data: result
    });
  });

  getWaitingList = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await toursService.getWaitingList(req.params.id, companyId);
    return res.json({
      status: 'success',
      msg: 'Turun gözləmə siyahısı gətirildi.',
      data: result
    });
  });

  leaveWaitingList = asyncHandler(async (req, res) => {
    const result = await toursService.leaveWaitingList(req.params.id, req.user.id);
    return res.json({
      status: 'success',
      msg: 'Tura aid gözləmə siyahısından uğurla çıxdınız.',
      data: result
    });
  });

  // Public / Admin metodları
  getAll = asyncHandler(async (req, res) => {
    const result = await toursService.getAll(req.query);
    return res.json({ status: 'success', msg: 'Turlar uğurla gətirildi', data: result });
  });

  getById = asyncHandler(async (req, res) => {
    const result = await toursService.getById(req.params.id);
    if (!result) throw ApiError.notFound('Tur tapılmadı');
    return res.json({ status: 'success', msg: 'Tur tapıldı', data: result });
  });

  exportTours = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const buffer = await toursService.exportToursToExcel(req.query, companyId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tours.xlsx');
    return res.send(buffer);
  });

  // Oturacaq Matrisi və Canlı Kilidləmə (Seat Service)
  getSeatMatrix = asyncHandler(async (req, res) => {
    const result = await seatService.getSeatMatrix(req.params.id);
    return res.json({ status: 'success', msg: 'Oturacaq matrisi gətirildi', data: result });
  });

  lockSeat = asyncHandler(async (req, res) => {
    const { seatNumber } = req.body;
    if (!seatNumber) throw ApiError.badRequest('Oturacaq nömrəsi daxil edilməlidir.');
    const result = await seatService.lockSeat(req.params.id, seatNumber, req.user.id);
    return res.json({ status: 'success', msg: 'Oturacaq uğurla kilidləndi', data: result });
  });

  releaseSeat = asyncHandler(async (req, res) => {
    const { seatNumber } = req.body;
    if (!seatNumber) throw ApiError.badRequest('Oturacaq nömrəsi daxil edilməlidir.');
    const result = await seatService.releaseSeat(req.params.id, seatNumber, req.user.id);
    return res.json({ status: 'success', msg: 'Oturacaq kilidi azad edildi', data: result });
  });

  // Dinamik Qiymət Hesablama (Pricing Engine)
  calculatePrice = asyncHandler(async (req, res) => {
    const { seats = 1, promoCode = null, targetCurrency = 'AZN' } = req.body;
    const loyaltyPoints = req.user?.loyaltyPoints || 0;
    const result = await pricingEngine.calculateFinalPrice({
      tourId: req.params.id,
      seats: parseInt(seats, 10),
      loyaltyPoints,
      promoCode,
      targetCurrency
    });
    return res.json({ status: 'success', msg: 'Dinamik qiymət uğurla hesablandı', data: result });
  });
}

export const toursController = new ToursController();
export default toursController;
