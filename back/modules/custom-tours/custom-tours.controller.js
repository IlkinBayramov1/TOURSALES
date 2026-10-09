import { customToursService } from './custom-tours.service.js';
import { asyncHandler } from '../../core/utils.js';

class CustomToursController {
  // POST /api/v1/custom-tours/estimate
  calculateEstimate = asyncHandler(async (req, res) => {
    const estimate = await customToursService.calculateEstimate(req.body);
    res.status(200).json({
      success: true,
      data: estimate,
    });
  });

  // POST /api/v1/custom-tours/requests
  createRequest = asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'İstifadəçi autentifikasiyası tələb olunur.' });
    }

    const request = await customToursService.createCustomRequest(userId, req.body);
    res.status(201).json({
      success: true,
      data: request,
    });
  });

  // GET /api/v1/custom-tours/my-requests
  getMyRequests = asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'İstifadəçi autentifikasiyası tələb olunur.' });
    }

    const requests = await customToursService.getMyRequests(userId);
    res.status(200).json({
      success: true,
      data: requests,
    });
  });

  // GET /api/v1/custom-tours/requests/:id
  getRequestDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const request = await customToursService.getRequestDetails(id, req.user?.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Fərdi tur sorğusu tapılmadı.' });
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  });

  // POST /api/v1/custom-tours/requests/:id/cancel
  cancelRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id || req.body.userId;
    const cancelled = await customToursService.cancelRequest(id, userId);

    res.status(200).json({
      success: true,
      data: cancelled,
      message: 'Fərdi tur sorğusu uğurla ləğv edildi.',
    });
  });

  // GET /api/v1/custom-tours/vendor/tender-board
  getTenderBoard = asyncHandler(async (req, res) => {
    const companyId = req.user?.companyId || req.query.companyId;
    const { destination, vehicleType, status } = req.query;

    const board = await customToursService.getTenderBoard(companyId, {
      destination,
      vehicleType,
      status,
    });

    res.status(200).json({
      success: true,
      data: board,
    });
  });

  // POST /api/v1/custom-tours/requests/:id/bids
  submitBid = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const companyId = req.user?.companyId || req.body.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Təklif vermək üçün tərəfdaş şirkət tələb olunur.' });
    }

    const bid = await customToursService.submitBid(companyId, id, req.body);
    res.status(201).json({
      success: true,
      data: bid,
      message: 'Təklifiniz uğurla müştəriyə göndərildi.',
    });
  });

  // GET /api/v1/custom-tours/vendor/my-bids
  getMyBids = asyncHandler(async (req, res) => {
    const companyId = req.user?.companyId || req.query.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Şirkət təyin edilməyib.' });
    }

    const bids = await customToursService.getMyBids(companyId);
    res.status(200).json({
      success: true,
      data: bids,
    });
  });

  // GET /api/v1/custom-tours/vendor/stats
  getVendorStats = asyncHandler(async (req, res) => {
    const companyId = req.user?.companyId || req.query.companyId;
    const stats = await customToursService.getVendorTenderStats(companyId);
    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  // PUT /api/v1/custom-tours/bids/:bidId
  updateBid = asyncHandler(async (req, res) => {
    const { bidId } = req.params;
    const companyId = req.user?.companyId || req.body.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Şirkət təyin edilməyib.' });
    }
    const updated = await customToursService.updateBid(companyId, bidId, req.body);
    res.status(200).json({
      success: true,
      data: updated,
      message: 'Təklifiniz uğurla yeniləndi.',
    });
  });

  // DELETE /api/v1/custom-tours/bids/:bidId
  withdrawBid = asyncHandler(async (req, res) => {
    const { bidId } = req.params;
    const companyId = req.user?.companyId || req.body.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Şirkət təyin edilməyib.' });
    }
    const result = await customToursService.withdrawBid(companyId, bidId);
    res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });
  });

  // POST /api/v1/custom-tours/bids/:bidId/accept
  acceptBid = asyncHandler(async (req, res) => {
    const { bidId } = req.params;
    const { requestId } = req.body;
    const userId = req.user?.id || req.body.userId;

    const updated = await customToursService.acceptBid(requestId, bidId, userId);
    res.status(200).json({
      success: true,
      data: updated,
      message: 'Təklif uğurla qəbul edildi. Ödəniş mərhələsinə keçə bilərsiniz.',
    });
  });

  // POST /api/v1/custom-tours/bids/:bidId/checkout
  checkoutBooking = asyncHandler(async (req, res) => {
    const { bidId } = req.params;
    const { requestId, paymentType, installmentMonths, cardLast4 } = req.body;
    const userId = req.user?.id || req.body.userId;

    const booking = await customToursService.checkoutBooking(requestId, bidId, userId, {
      paymentType,
      installmentMonths,
      cardLast4,
    });

    res.status(200).json({
      success: true,
      data: booking,
      message: 'Fərdi tur rezervasiyası və ödənişi təsdiqləndi!',
    });
  });
}

export default new CustomToursController();
