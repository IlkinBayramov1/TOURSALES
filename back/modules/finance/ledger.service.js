import { Prisma } from '@prisma/client';
import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import ApiError from '../../core/api.error.js';

class LedgerService {
  // Şirkət üçün standart maliyyə hesablarının yaradılması (Asset, Liability, Revenue, Expense)
  async getOrCreateCompanyAccounts(companyId, tx = prisma) {
    let companyAccounts = await tx.ledgerAccount.findMany({
      where: { companyId }
    });

    if (companyAccounts.length === 0) {
      const payableId = await generateUniqueId('LA', 'ledgerAccount');
      const payableAccount = await tx.ledgerAccount.create({
        data: {
          id: payableId,
          companyId,
          type: 'LIABILITY',
          name: 'Vendor Payable Account',
          currency: 'AZN'
        }
      });
      companyAccounts.push(payableAccount);
    }

    return companyAccounts;
  }

  // Atomik İkiqat Yazılış (Double-Entry Posting) with Prisma Decimal Precision
  // Total Debit MUST equal Total Credit (Decimal.equals)
  async recordBookingSale({ bookingId, companyId, totalAmount, commissionAmount, netAmount, description }, tx = prisma) {
    const journalId = await generateUniqueId('JRN', 'ledgerEntry');
    const totalDec = new Prisma.Decimal(totalAmount);
    const commDec = new Prisma.Decimal(commissionAmount);
    const netDec = new Prisma.Decimal(netAmount);

    // Strict Decimal validation: totalDec === commDec + netDec
    if (!totalDec.equals(commDec.add(netDec))) {
      throw ApiError.badRequest('Ledger balans uyğunsuzluğu: Toplam Debit Kreditə bərabər deyil.');
    }

    const companyAccounts = await this.getOrCreateCompanyAccounts(companyId, tx);
    const vendorPayableAccount = companyAccounts.find(a => a.type === 'LIABILITY');

    // 1. Customer Payment Asset (Debit +TotalAmount)
    const entry1Id = await generateUniqueId('LE', 'ledgerEntry');
    await tx.ledgerEntry.create({
      data: {
        id: entry1Id,
        journalId,
        accountId: vendorPayableAccount.id,
        bookingId,
        entryType: 'DEBIT',
        debit: totalDec,
        credit: new Prisma.Decimal(0),
        currency: 'AZN',
        referenceType: 'BOOKING_SALE',
        referenceId: bookingId,
        description: description || `Bilet satışı: Total ${totalDec.toString()} AZN`
      }
    });

    // 2. Platform Commission Revenue (Credit +CommissionAmount)
    const entry2Id = await generateUniqueId('LE', 'ledgerEntry');
    await tx.ledgerEntry.create({
      data: {
        id: entry2Id,
        journalId,
        accountId: vendorPayableAccount.id,
        bookingId,
        entryType: 'CREDIT',
        debit: new Prisma.Decimal(0),
        credit: commDec,
        currency: 'AZN',
        referenceType: 'PLATFORM_COMMISSION',
        referenceId: bookingId,
        description: `Platforma komissiyası: ${commDec.toString()} AZN`
      }
    });

    // 3. Vendor Payable Liability (Credit +NetAmount)
    const entry3Id = await generateUniqueId('LE', 'ledgerEntry');
    await tx.ledgerEntry.create({
      data: {
        id: entry3Id,
        journalId,
        accountId: vendorPayableAccount.id,
        bookingId,
        entryType: 'CREDIT',
        debit: new Prisma.Decimal(0),
        credit: netDec,
        currency: 'AZN',
        referenceType: 'VENDOR_PAYABLE',
        referenceId: bookingId,
        description: `Vendor xalis gəliri: ${netDec.toString()} AZN`
      }
    });

    return { journalId, status: 'POSTED' };
  }

  // Reversal Posting for Refunds or Adjustments (Strictly Immutable Ledger)
  async recordReversalEntry({ originalJournalId, bookingId, companyId, refundAmount, reason }, tx = prisma) {
    const journalId = await generateUniqueId('JRN', 'ledgerEntry');
    const refundDec = new Prisma.Decimal(refundAmount);
    const companyAccounts = await this.getOrCreateCompanyAccounts(companyId, tx);
    const vendorPayableAccount = companyAccounts.find(a => a.type === 'LIABILITY');

    // Debit Vendor Payable Liability / Refund Adjustment
    const entry1Id = await generateUniqueId('LE', 'ledgerEntry');
    await tx.ledgerEntry.create({
      data: {
        id: entry1Id,
        journalId,
        accountId: vendorPayableAccount.id,
        bookingId,
        entryType: 'DEBIT',
        debit: refundDec,
        credit: new Prisma.Decimal(0),
        currency: 'AZN',
        referenceType: 'REFUND_REVERSAL',
        referenceId: originalJournalId,
        description: reason || `Geri qaytarılma (Refund Reversal): ${refundDec.toString()} AZN`
      }
    });

    // Credit Customer Refund Account
    const entry2Id = await generateUniqueId('LE', 'ledgerEntry');
    await tx.ledgerEntry.create({
      data: {
        id: entry2Id,
        journalId,
        accountId: vendorPayableAccount.id,
        bookingId,
        entryType: 'CREDIT',
        debit: new Prisma.Decimal(0),
        credit: refundDec,
        currency: 'AZN',
        referenceType: 'REFUND_EXECUTION',
        referenceId: originalJournalId,
        description: `Müştəriyə qaytarılan məbləğ: ${refundDec.toString()} AZN`
      }
    });

    return { journalId, status: 'REVERSED' };
  }

  // Ledger üzrə maliyyə audit tarixçəsi
  async getAuditEntries(companyId = null) {
    const where = {};
    if (companyId) {
      where.account = { companyId };
    }

    return prisma.ledgerEntry.findMany({
      where,
      include: {
        account: {
          select: { name: true, type: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const ledgerService = new LedgerService();
export default ledgerService;
