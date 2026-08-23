import express from 'express';
import voucherService from './voucher.service.js';

const router = express.Router();

// GET /api/v1/vouchers/:token/verify - Backend QR Verification Endpoint
router.get('/:token/verify', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { bookingId } = req.query;
    const result = await voucherService.verifyVoucherToken(token, bookingId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/vouchers/:bookingId/pdf - Download PDF Voucher
router.get('/:bookingId/pdf', async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const pdfBuffer = await voucherService.generatePdfVoucher(bookingId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=voucher-${bookingId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

export default router;
