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

  // Atomik İkiqat Yazılış (Double-Entry Posting)
  // Əsas Prinsip: Total Debit MUST equal Total Credit
  async recordBookingSale({ bookingId, companyId, totalAmount, commissionAmount, netAmount, description }, tx = prisma) {
    const journalId = await generateUniqueId('JRN', 'ledgerEntry');
    const totalAmt = Number(totalAmount);
    const commAmt = Number(commissionAmount);
    const netAmt = Number(netAmount);

    if (Math.abs(totalAmt - (commAmt + netAmt)) > 0.001) {
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
        debit: totalAmt,
        credit: 0.0,
        currency: 'AZN',
        referenceType: 'BOOKING_SALE',
        referenceId: bookingId,
        description: description || `Bilet satışı: Total ${totalAmt} AZN`
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
        debit: 0.0,
        credit: commAmt,
        currency: 'AZN',
        referenceType: 'PLATFORM_COMMISSION',
        referenceId: bookingId,
        description: `Platforma komissiyası: ${commAmt} AZN`
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
        debit: 0.0,
        credit: netAmt,
        currency: 'AZN',
        referenceType: 'VENDOR_PAYABLE',
        referenceId: bookingId,
        description: `Vendor xalis gəliri: ${netAmt} AZN`
      }
    });

    return { journalId, status: 'POSTED' };
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
