import crypto from 'crypto';
import prisma from '../../config/db.js';
import env from '../../config/env.js';
import ApiError from '../../core/api.error.js';
import PDFGenerator from '../../utils/pdf-generator.js';

class VoucherService {
  constructor() {
    this.secretKey = env.JWT_SECRET || 'toursales_voucher_secret_key';
  }

  // 1. Cryptographic QR Token Generation
  generateQrToken(bookingId) {
    const payload = JSON.stringify({ bookingId, ts: Date.now() });
    const hmac = crypto.createHmac('sha256', this.secretKey).update(payload).digest('hex');
    return Buffer.from(payload).toString('base64') + '.' + hmac;
  }

  // 2. Backend QR Verification Endpoint Logic
  async verifyVoucherToken(token, bookingIdQuery = null) {
    try {
      let bookingId = bookingIdQuery;

      if (token.includes('.')) {
        const [base64Payload, hmac] = token.split('.');
        const payloadStr = Buffer.from(base64Payload, 'base64').toString('utf-8');
        const expectedHmac = crypto.createHmac('sha256', this.secretKey).update(payloadStr).digest('hex');

        if (hmac !== expectedHmac) {
          throw ApiError.unauthorized('Saxta və ya dəyişdirilmiş bilet QR kodu!');
        }
        bookingId = JSON.parse(payloadStr).bookingId;
      }

      if (!bookingId) {
        throw ApiError.badRequest('Bilet ID müəyyənləşdirilə bilmədi.');
      }

      const booking = await prisma.booking.findFirst({
        where: { id: bookingId, deletedAt: null },
        include: {
          tour: true,
          company: true
        }
      });

      if (!booking) {
        return {
          valid: false,
          status: 'NOT_FOUND',
          message: 'Bilet tapılmadı və ya bazadan silinib.'
        };
      }

      const isExpired = new Date(booking.tour.startDate) < new Date();
      const isCancelled = booking.status === 'CANCELLED';

      let verificationStatus = 'VALID';
      if (isCancelled) verificationStatus = 'CANCELLED';
      else if (isExpired) verificationStatus = 'EXPIRED';

      return {
        valid: !isCancelled && !isExpired,
        verificationStatus,
        bookingId: booking.id,
        passenger: `${booking.passengerName} ${booking.passengerSurname}`,
        passport: booking.passengerPassport || 'Yoxdur',
        tourTitle: booking.tour ? booking.tour.title : 'N/A',
        tourStartDate: booking.tour ? booking.tour.startDate : null,
        seats: booking.seats,
        busSeatNumber: booking.busSeatNumber || 'Təyin edilməyib',
        paymentStatus: booking.paymentStatus,
        companyName: booking.company ? booking.company.name : 'N/A',
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.badRequest('QR biletinin doğrulanması uğursuz oldu.');
    }
  }

  // 3. Download PDF Voucher Stream
  async generatePdfVoucher(bookingId) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: { tour: true, company: true }
    });

    if (!booking) throw ApiError.notFound('Rezervasiya tapılmadı.');

    return PDFGenerator.generateVoucherPDF(booking);
  }
}

export const voucherService = new VoucherService();
export default voucherService;
