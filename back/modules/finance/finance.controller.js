import { asyncHandler } from '../../core/utils.js';
import { financeService } from './finance.service.js';
import { taxEngine } from './tax.engine.js';
import { ledgerService } from './ledger.service.js';
import PDFGenerator from '../../utils/pdf-generator.js';
import prisma from '../../config/db.js';
import ApiError from '../../core/api.error.js';
import { ROLES } from '../../config/constants.js';

class FinanceController {
  getBalances = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu istifadəçiyə bağlı hər hansı şirkət yoxdur.');
    }
    const result = await financeService.getBalances(req.user.companyId);
    return res.json({ status: 'success', msg: 'Balans məlumatları gətirildi', data: result });
  });

  getTransactions = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await financeService.getTransactions(req.query, companyId);
    return res.json({ status: 'success', msg: 'Tranzaksiyalar gətirildi', data: result });
  });

  requestPayout = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Yalnız vendor şirkətləri pul çıxarışı tələb edə bilər.');
    }
    const { amount, bankAccount } = req.body;
    if (!amount || !bankAccount) throw ApiError.badRequest('Məbləğ və Bank hesabı daxil edilməlidir.');
    const result = await financeService.requestPayout(req.user.companyId, amount, bankAccount);
    return res.status(201).json({ status: 'success', msg: 'Çıxarış sorğusu yaradıldı', data: result });
  });

  processPayout = asyncHandler(async (req, res) => {
    const { payoutId } = req.params;
    const { status } = req.body;
    if (!status) throw ApiError.badRequest('Status daxil edilməlidir.');
    const result = await financeService.processPayout(payoutId, status);
    return res.json({ status: 'success', msg: 'Çıxarış sorğusu emal edildi', data: result });
  });

  getAllPayouts = asyncHandler(async (req, res) => {
    const result = await financeService.getAllPayouts(req.query);
    return res.json({ status: 'success', msg: 'Bütün çıxarış sorğuları gətirildi', data: result });
  });

  exportTransactions = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const buffer = await financeService.exportTransactionsToExcel(req.query, companyId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');
    return res.send(buffer);
  });

  // Azərbaycan DVX e-Qaimə XML Generator
  getEQaimeXML = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const result = await taxEngine.generateInvoiceForBooking(bookingId);
    return res.json({
      status: 'success',
      msg: 'e-Qaimə XML sənədi uğurla generasiya edildi',
      data: result
    });
  });

  // Kommersiya Faktura PDF Endirilməsi
  getInvoicePDF = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { company: true }
    });
    if (!booking) throw ApiError.notFound('Rezervasiya tapılmadı.');

    const pdfBuffer = await PDFGenerator.generateInvoicePDF(booking, booking.company);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${booking.id}.pdf`);
    return res.send(pdfBuffer);
  });

  // İkiqat Yazılışlı Maliyyə Baş Kitabı (Ledger) Auditi
  getLedgerAudit = asyncHandler(async (req, res) => {
    const companyId = req.user.role === ROLES.SUPERADMIN ? null : req.user.companyId;
    const result = await ledgerService.getAuditEntries(companyId);
    return res.json({
      status: 'success',
      msg: 'Maliyyə auditi qeydləri gətirildi',
      data: result
    });
  });
}

export const financeController = new FinanceController();
export default financeController;
