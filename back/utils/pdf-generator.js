import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import crypto from 'crypto';
import env from '../config/env.js';

export class PDFGenerator {
  static generateHMAC(bookingId, companyId) {
    const secret = env.JWT_SECRET || 'toursales-hmac-secret';
    return crypto.createHmac('sha256', secret).update(`${bookingId}:${companyId}`).digest('hex');
  }

  static async generateVoucherPDF(booking) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(22).fillColor('#1E293B').text('TOURSALES ENTERPRISE TRAVEL VOUCHER', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#64748B').text(`Bilet ID: ${booking.id} | Tarix: ${new Date().toLocaleDateString('az-AZ')}`, { align: 'center' });
        doc.moveDown(1.5);

        // Divider
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#CBD5E1').stroke();
        doc.moveDown(1);

        // Sərnişin və Tur Məlumatları
        doc.fontSize(14).fillColor('#0F172A').text('Sərnişin və Səyahət Məlumatları');
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#334155')
          .text(`Ad Soyad: ${booking.passengerName} ${booking.passengerSurname}`)
          .text(`Email: ${booking.contactEmail}`)
          .text(`Telefon: ${booking.contactNumber}`)
          .text(`Pasport: ${booking.passengerPassport || 'N/A'}`)
          .text(`Turun Adı: ${booking.tour ? booking.tour.title : 'Səyahət Turu'}`)
          .text(`Yer Sayı: ${booking.seats}`)
          .text(`Status: ${booking.status}`)
          .text(`Ödənilən Məbləğ: ${booking.paidAmount} AZN`);

        doc.moveDown(1.5);

        // HMAC QR Verification Token
        const hmac = this.generateHMAC(booking.id, booking.companyId);
        const verifyUrl = `http://localhost:5000/api/v1/vouchers/${hmac}/verify?bookingId=${booking.id}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl);

        // QR Image embedding
        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
        const qrBuffer = Buffer.from(base64Data, 'base64');
        doc.image(qrBuffer, 400, doc.y - 120, { width: 120, height: 120 });

        doc.fontSize(9).fillColor('#94A3B8').text('Yuxarıdakı QR kod vasitəsilə biletin həqiqiliyini doğrudan backend-də doğrulaya bilərsiniz.', 40, doc.y + 10);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  static async generateInvoicePDF(booking, company) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(20).fillColor('#0F172A').text('RƏSMİ E-QAİMƏ KOMMERSİYA FAKTURASI', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#64748B').text(`Şirkət: ${company ? company.name : 'TOURSALES Partner'} | VOEN: ${company?.voen || 'N/A'}`, { align: 'center' });
        doc.moveDown(1.5);

        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#CBD5E1').stroke();
        doc.moveDown(1);

        doc.fontSize(12).fillColor('#334155')
          .text(`Faktura №: INV-${booking.id}`)
          .text(`Müştəri: ${booking.passengerName} ${booking.passengerSurname}`)
          .text(`Məbləğ: ${booking.totalAmount} AZN`)
          .text(`ƏDV dərəcəsi: 0% (Turizm Xidməti)`)
          .text(`Tarix: ${new Date().toLocaleDateString('az-AZ')}`);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default PDFGenerator;
