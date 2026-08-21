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

  getById = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await bookingsService.getById(req.params.id, companyId);
    if (!result) throw ApiError.notFound('Rezervasiya tapılmadı');
    return res.json({ status: 'success', msg: 'Rezervasiya tapıldı', data: result });
  });

  create = asyncHandler(async (req, res) => {
    const files = req.files || [];
    const companyId = req.user.role === ROLES.VENDOR ? req.user.companyId : null;
    const channel = req.user.role === ROLES.VENDOR ? 'MANUAL' : 'PLATFORM';

    const result = await bookingsService.create(req.body, companyId, channel, files);
    return res.status(201).json({ status: 'success', msg: 'Rezervasiya uğurla yaradıldı', data: result });
  });

  cancel = asyncHandler(async (req, res) => {
    const result = await bookingsService.cancelBooking(req.params.id, req.user);
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
}

export const bookingsController = new BookingsController();
export default bookingsController;
