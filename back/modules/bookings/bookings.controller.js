import { asyncHandler } from '../../core/utils.js';
import { bookingsService } from './bookings.service.js';
import ApiError from '../../core/api.error.js';
import { ROLES } from '../../config/constants.js';
import path from 'path';
import fs from 'fs';

class BookingsController {
  getAll = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await bookingsService.getAll(req.query, companyId);
    return res.json({ status: 'success', msg: 'Rezervasiyalar uğurla gətirildi', data: result });
  });

  getMyBookings = asyncHandler(async (req, res) => {
    const result = await bookingsService.getMyBookings(req.user.email, req.user.id);
    return res.json({ status: 'success', msg: 'Sifarişləriniz uğurla gətirildi', data: result });
  });

  getById = asyncHandler(async (req, res) => {
    const companyId = req.user ? (req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId) : null;
    const result = await bookingsService.getById(req.params.id, companyId);
    if (!result) throw ApiError.notFound('Rezervasiya tapılmadı');
    return res.json({ status: 'success', msg: 'Rezervasiya tapıldı', data: result });
  });

  create = asyncHandler(async (req, res) => {
    const files = req.files || [];
    const companyId = req.user?.role === ROLES.VENDOR ? req.user.companyId : null;
    const channel = req.user?.role === ROLES.VENDOR ? 'MANUAL' : 'PLATFORM';

    const result = await bookingsService.create(req.body, companyId, channel, files, req.user?.id || null);
    return res.status(201).json({ status: 'success', msg: 'Rezervasiya uğurla yaradıldı', data: result });
  });

  cancel = asyncHandler(async (req, res) => {
    const reason = req.body.reason || '';
    const result = await bookingsService.cancelBooking(req.params.id, req.user, reason);
    return res.json({
      status: 'success',
      msg: `Rezervasiya uğurla ləğv edildi. Geri ödənilən məbləğ (${result.refundPercent}%): ${result.refundAmount} AZN`,
      data: result
    });
  });

  exportBookings = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const buffer = await bookingsService.exportBookingsToExcel(req.query, companyId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings.xlsx');
    return res.send(buffer);
  });

  downloadDocument = asyncHandler(async (req, res) => {
    const { id, fileId } = req.params;
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;

    const booking = await bookingsService.getById(id, companyId);
    if (!booking) throw ApiError.notFound('Rezervasiya tapılmadı.');

    let docList = [];
    try {
      docList = JSON.parse(booking.documents || '[]');
    } catch (e) {
      docList = [];
    }

    const matchedPath = docList.find(p => p.includes(fileId));
    if (!matchedPath) {
      throw ApiError.notFound('Sənəd tapılmadı.');
    }

    const absolutePath = path.resolve(matchedPath);
    if (!fs.existsSync(absolutePath)) {
      throw ApiError.notFound('Fayl server diskində tapılmadı.');
    }

    return res.sendFile(absolutePath);
  });

  // --- VENDOR ENDPOINTS ---

  getVendorBookings = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.query.companyId;
    if (!companyId) throw ApiError.badRequest('Şirkət ID təyin edilməyib.');

    const result = await bookingsService.getVendorBookings(companyId, req.query);
    return res.json({ status: 'success', msg: 'Sifarişlər gətirildi', data: result });
  });

  getVendorStats = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.query.companyId;
    if (!companyId) throw ApiError.badRequest('Şirkət ID təyin edilməyib.');

    const result = await bookingsService.getVendorStats(companyId);
    return res.json({ status: 'success', msg: 'Statistika gətirildi', data: result });
  });

  getVendorBookingById = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.query.companyId;
    if (!companyId) throw ApiError.badRequest('Şirkət ID təyin edilməyib.');

    const result = await bookingsService.getVendorBookingById(req.params.id, companyId);
    if (!result) throw ApiError.notFound('Rezervasiya tapılmadı');
    return res.json({ status: 'success', msg: 'Rezervasiya tapıldı', data: result });
  });

  getVendorRoster = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.query.companyId;
    if (!companyId) throw ApiError.badRequest('Şirkət ID təyin edilməyib.');

    const result = await bookingsService.getVendorRoster(req.params.tourId, companyId);
    return res.json({ status: 'success', msg: 'Sərnişin manifesti gətirildi', data: result });
  });

  checkIn = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.body.companyId;
    if (!companyId) throw ApiError.badRequest('Şirkət ID təyin edilməyib.');

    const result = await bookingsService.checkInTicket(req.body, companyId, req.user.name || req.user.id);
    return res.json({ status: 'success', msg: 'Minik qeydiyyatı təsdiqləndi', data: result });
  });

  toggleCheckIn = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.body.companyId;
    if (!companyId) throw ApiError.badRequest('Şirkət ID təyin edilməyib.');

    const result = await bookingsService.toggleCheckIn(
      req.params.id,
      req.body.seatNumber,
      companyId,
      req.user.name || req.user.id
    );
    return res.json({ status: 'success', msg: 'Minik statusu yeniləndi', data: result });
  });

  exportVendorBookings = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.query.companyId;
    if (!companyId) throw ApiError.badRequest('Şirkət ID təyin edilməyib.');

    const buffer = await bookingsService.exportBookingsToExcel(req.query, companyId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=vendor-bookings.xlsx');
    return res.send(buffer);
  });

  exportVendorRoster = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.query.companyId;
    if (!companyId) throw ApiError.badRequest('Şirkət ID təyin edilməyib.');

    const buffer = await bookingsService.exportVendorRosterToExcel(req.params.tourId, companyId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=roster-${req.params.tourId}.xlsx`);
    return res.send(buffer);
  });

  getGuideTours = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.query.companyId;
    const result = await bookingsService.getGuideTours(
      req.user.id,
      companyId,
      req.user.agencyRole || req.user.role
    );
    return res.json({ status: 'success', msg: 'Bələdçi turları gətirildi', data: result });
  });

  getGuideManifest = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.query.companyId;
    const result = await bookingsService.getGuideManifest(req.params.tourId, companyId);
    return res.json({ status: 'success', msg: 'Tur manifesti gətirildi', data: result });
  });

  scanQrCheckIn = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.body.companyId;
    const result = await bookingsService.scanQrCheckIn(
      req.body,
      req.user.id,
      req.user.name || req.user.email || 'Bələdçi',
      companyId
    );
    return res.json({
      status: result.isDuplicate ? 'warning' : 'success',
      msg: result.message || 'Sərnişin minik qeydiyyatı təsdiqləndi',
      data: result
    });
  });

  toggleGuideCheckIn = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.body.companyId;
    const result = await bookingsService.toggleGuideCheckIn(
      req.params.id,
      req.body.seatNumber,
      req.user.id,
      req.user.name || 'Bələdçi',
      companyId
    );
    return res.json({ status: 'success', msg: 'Minik statusu yeniləndi', data: result });
  });

  syncOfflineCheckIns = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.body.companyId;
    const result = await bookingsService.syncOfflineCheckIns(
      req.body.tourId,
      req.body.checkIns || [],
      req.user.id,
      req.user.name || 'Bələdçi',
      companyId
    );
    return res.json({ status: 'success', msg: 'Oflayn qeydiyyatlar sinxronlaşdırıldı', data: result });
  });

  sendBookingWhatsApp = asyncHandler(async (req, res) => {
    const result = await bookingsService.sendBookingWhatsApp(req.params.id);
    return res.json({ status: 'success', msg: 'WhatsApp bildirişi göndərildi', data: result });
  });

  sendBalanceReminderWhatsApp = asyncHandler(async (req, res) => {
    const result = await bookingsService.sendBalanceReminderWhatsApp(req.params.id);
    return res.json({ status: 'success', msg: 'Qalıq ödəniş xatırlatması WhatsApp ilə göndərildi', data: result });
  });

  getCompanyGuides = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.query.companyId;
    const result = await bookingsService.getCompanyGuides(companyId);
    return res.json({ status: 'success', msg: 'Bələdçi heyəti gətirildi', data: result });
  });

  assignGuideToTour = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.body.companyId;
    const result = await bookingsService.assignGuideToTour(
      req.params.tourId,
      req.body,
      companyId
    );
    return res.json({ status: 'success', msg: 'Bələdçi və minik məlumatları tura uğurla təhkim edildi', data: result });
  });

  bulkCheckIn = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.body.companyId;
    const result = await bookingsService.bulkCheckIn(
      req.body.tourId,
      req.body.bookingIds,
      req.user.id,
      req.user.name || 'Bələdçi',
      companyId
    );
    return res.json({ status: 'success', msg: result.message, data: result });
  });

  exportGuideManifest = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.query.companyId;
    const buffer = await bookingsService.exportGuideManifest(req.params.tourId, companyId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=manifest-${req.params.tourId}.xlsx`);
    return res.send(buffer);
  });
}

export const bookingsController = new BookingsController();
export default bookingsController;
