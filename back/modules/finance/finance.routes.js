import express from 'express';
import { financeController } from './finance.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Bütün maliyyə marşrutları üçün auth vacibdir
router.use(authMiddleware());

// Balans məlumatları və çıxarış tələbləri (Vendor üçün)
router.get('/balance', roleMiddleware(ROLES.VENDOR), financeController.getBalances);
router.post('/payout', roleMiddleware(ROLES.VENDOR), financeController.requestPayout);

// Vendor Paneli üçün spesifik marşrutlar
router.get('/vendor/overview', financeController.getVendorOverview);
router.get('/vendor/transactions', financeController.getVendorTransactions);
router.get('/vendor/payouts', financeController.getVendorPayouts);
router.post('/vendor/payout-request', financeController.requestPayout);
router.get('/vendor/export', financeController.exportTransactions);

// Tranzaksiyalar və Excel ixracı (Vendor və Admin)
router.get('/transactions', financeController.getTransactions);
router.get('/transactions/export', financeController.exportTransactions);

// Payout sorğularının siyahısı və təsdiq/rədd edilməsi (SuperAdmin üçün)
router.get('/payouts', roleMiddleware(ROLES.SUPERADMIN), financeController.getAllPayouts);
router.patch('/payouts/:payoutId', roleMiddleware(ROLES.SUPERADMIN), financeController.processPayout);

// Azərbaycan e-Qaimə XML və Rəsmi Kommersiya Fakturası
router.get('/invoices/:bookingId/eqaime', financeController.getEQaimeXML);
router.get('/invoices/:bookingId/pdf', financeController.getInvoicePDF);

// İkiqat Yazılışlı Maliyyə Baş Kitabı (Ledger) Auditi
router.get('/ledger/audit', financeController.getLedgerAudit);

export default router;
