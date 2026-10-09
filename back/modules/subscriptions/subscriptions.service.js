import prisma from '../../config/db.js';
import { generateExcel } from '../../utils/excel-generator.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import { ApiError } from '../../core/api.error.js';

class SubscriptionsService {
  async getAllPlans() {
    return prisma.subscriptionPlan.findMany();
  }

  async createPlan(data) {
    const id = await generateUniqueId('SP', 'subscriptionPlan');
    return prisma.subscriptionPlan.create({
      data: {
        id,
        name: data.name,
        monthlyPrice: parseFloat(data.monthlyPrice),
        domesticCommission: parseFloat(data.domesticCommission),
        foreignCommission: parseFloat(data.foreignCommission),
        features: JSON.stringify(data.features || [])
      }
    });
  }

  async updatePlan(id, data) {
    return prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: data.name,
        monthlyPrice: data.monthlyPrice ? parseFloat(data.monthlyPrice) : undefined,
        domesticCommission: data.domesticCommission ? parseFloat(data.domesticCommission) : undefined,
        foreignCommission: data.foreignCommission ? parseFloat(data.foreignCommission) : undefined,
        features: data.features ? JSON.stringify(data.features) : undefined
      }
    });
  }

  async getSubscribers() {
    const companies = await prisma.company.findMany({
      where: {
        planId: { not: null }
      },
      include: {
        plan: true,
        payments: {
          orderBy: { dueDate: 'desc' }
        }
      }
    });

    return companies.map((c) => {
      const lastPayment = c.payments[0] || null;
      let delayStatus = 'Gecikmə yoxdur';
      if (lastPayment && lastPayment.status !== 'Paid' && new Date() > new Date(lastPayment.dueDate)) {
        delayStatus = 'Borclu/Gecikib';
      }

      return {
        companyId: c.id,
        companyName: c.name,
        planName: c.plan ? c.plan.name : 'Bilinmir',
        status: c.status,
        delayStatus,
        nextPaymentDate: lastPayment ? lastPayment.dueDate : null,
        payments: c.payments
      };
    });
  }

  async exportSubscribersToExcel() {
    const subscribers = await this.getSubscribers();

    const columns = [
      { header: 'Şirkət ID', key: 'companyId', width: 15 },
      { header: 'Şirkət Adı', key: 'companyName', width: 25 },
      { header: 'İstifadə Etdiyi Plan', key: 'planName', width: 20 },
      { header: 'Hesab Statusu', key: 'status', width: 15 },
      { header: 'Gecikmə/Borc', key: 'delayStatus', width: 20 },
      { header: 'Növbəti Ödəniş Tarixi', key: 'nextPaymentDate', width: 20 }
    ];

    const formattedData = subscribers.map((s) => ({
      companyId: s.companyId,
      companyName: s.companyName,
      planName: s.planName,
      status: s.status,
      delayStatus: s.delayStatus,
      nextPaymentDate: s.nextPaymentDate ? s.nextPaymentDate.toISOString().split('T')[0] : 'Təyin edilməyib'
    }));

    return generateExcel(formattedData, columns, 'Abunəçilər');
  }

  // --- VENDOR SUBSCRIPTION METHODS ---

  async getCurrentSubscription(companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true }
    });

    if (!company) throw ApiError.notFound('Şirkət tapılmadı.');

    const activeToursCount = await prisma.tour.count({
      where: { companyId, deletedAt: null }
    });

    const activeMembersCount = await prisma.user.count({
      where: { companyId, deletedAt: null }
    });

    const activeApiKeysCount = await prisma.apiKey.count({
      where: { companyId, status: 'Active' }
    });

    let plan = company.plan;
    if (!plan) {
      plan = await prisma.subscriptionPlan.findFirst({
        where: { name: { contains: 'Pro' } }
      }) || await prisma.subscriptionPlan.findFirst();
    }

    let parsedFeatures = [];
    if (plan?.features) {
      try {
        parsedFeatures = JSON.parse(plan.features);
      } catch (e) {
        parsedFeatures = [];
      }
    }

    const planName = plan ? plan.name : 'Peşəkar (Pro)';
    const maxTours = planName.includes('Starter') ? 5 : planName.includes('Pro') ? 50 : -1;
    const maxMembers = planName.includes('Starter') ? 1 : planName.includes('Pro') ? 5 : -1;
    const maxApiKeys = planName.includes('Starter') ? 0 : planName.includes('Pro') ? 2 : -1;

    const now = new Date();
    let daysLeft = 0;
    if (company.nextBillingDate) {
      const diffTime = new Date(company.nextBillingDate).getTime() - now.getTime();
      daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return {
      companyId: company.id,
      companyName: company.name,
      planId: plan ? plan.id : null,
      planName,
      monthlyPrice: plan ? Number(plan.monthlyPrice) : 49,
      domesticCommission: plan ? Number(plan.domesticCommission) : 5.0,
      foreignCommission: plan ? Number(plan.foreignCommission) : 7.0,
      commissionRate: plan ? Number(plan.domesticCommission) : 5.0,
      features: parsedFeatures,
      maxTours,
      activeToursCount,
      maxMembers,
      activeMembersCount,
      maxApiKeys,
      activeApiKeysCount,
      daysLeft,
      autoRenewSubscription: company.autoRenewSubscription ?? true,
      nextBillingDate: company.nextBillingDate || null,
      availableBalance: Number(company.availableBalance || 0)
    };
  }

  async getBillingHistory(companyId) {
    const payments = await prisma.subscriptionPayment.findMany({
      where: { companyId },
      include: { plan: true },
      orderBy: { paymentDate: 'desc' }
    });

    return payments.map((p) => ({
      id: p.id,
      invoiceNumber: `INV-${p.id.replace('SPY-', '')}`,
      planId: p.planId,
      planName: p.plan?.name || 'Abunəlik Planı',
      amount: Number(p.amount),
      currency: 'AZN',
      paymentDate: p.paymentDate,
      dueDate: p.dueDate,
      status: p.status,
      paymentMethod: 'Balansdan çıxılma'
    }));
  }

  async getInvoiceDetails(companyId, paymentId) {
    const payment = await prisma.subscriptionPayment.findFirst({
      where: { id: paymentId, companyId },
      include: { plan: true, company: true }
    });

    if (!payment) throw ApiError.notFound('Faktura tapılmadı.');

    const company = payment.company;
    const plan = payment.plan;
    const amount = Number(payment.amount);

    return {
      invoiceNumber: `INV-${payment.id.replace('SPY-', '')}`,
      id: payment.id,
      issueDate: payment.paymentDate,
      dueDate: payment.dueDate,
      status: payment.status,
      currency: 'AZN',
      seller: {
        name: 'TOURSALES MMC',
        voen: '1405987121',
        address: 'Nizami küç. 142, Bakı, Azərbaycan',
        email: 'billing@toursales.az',
        phone: '+994 (12) 400-00-00',
        iban: 'AZ45IBAZ38010000000000123456'
      },
      customer: {
        id: company.id,
        name: company.name,
        voen: company.voen || 'VÖEN qeyd olunmayıb',
        address: company.address || 'Ünvan qeyd olunmayıb',
        email: company.email || '—',
        phone: company.phoneNumber || '—',
        iban: company.iban || '—'
      },
      items: [
        {
          description: `${plan?.name || 'Abunəlik Planı'} xidməti üzrə lisenziya haqqı`,
          period: '1 Ay',
          quantity: 1,
          unitPrice: amount,
          total: amount
        }
      ],
      subtotal: amount,
      tax: 0.0,
      total: amount,
      paymentMethod: 'Platforma Hesablaşma Balansı'
    };
  }

  async toggleAutoRenewal(companyId, autoRenew) {
    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { autoRenewSubscription: Boolean(autoRenew) }
    });
    return {
      success: true,
      autoRenewSubscription: updated.autoRenewSubscription,
      message: updated.autoRenewSubscription 
        ? 'Abunəliyin avtomatik yenilənməsi aktivləşdirildi.' 
        : 'Abunəliyin avtomatik yenilənməsi dayandırıldı.'
    };
  }

  async changePlan(companyId, payload) {
    const planId = typeof payload === 'string' ? payload : payload.planId;
    const billingCycle = payload?.billingCycle || 'MONTHLY'; // 'MONTHLY' | 'YEARLY'
    const paymentMethod = (payload?.paymentMethod || (payload?.payFromBalance === false ? 'CARD' : 'BALANCE')).toUpperCase(); // 'BALANCE' | 'CARD' | 'BANK_TRANSFER'

    const [company, plan] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId }, include: { plan: true } }),
      prisma.subscriptionPlan.findUnique({ where: { id: planId } })
    ]);

    if (!company) throw ApiError.notFound('Şirkət tapılmadı.');
    if (!plan) throw ApiError.notFound('Abunəlik planı tapılmadı.');

    // 1. Ağıllı Downgrade Guard (Aktiv turlar limiti yoxlanışı)
    const targetMaxTours = plan.name?.includes('Starter') ? 5 : plan.name?.includes('Pro') ? 50 : -1;
    if (targetMaxTours !== -1) {
      const activeToursCount = await prisma.tour.count({
        where: { companyId, status: 'Active', deletedAt: null }
      });
      if (activeToursCount > targetMaxTours) {
        throw ApiError.badRequest(
          `Planı '${plan.name}' səviyyəsinə endirə bilməzsiniz. Sizin hazırda ${activeToursCount} aktiv turunuz var, lakin bu plan yalnız maksimum ${targetMaxTours} aktiv tura icazə verir. Zəhmət olmasa, əvvəlcə ən azı ${activeToursCount - targetMaxTours} turu arxivləşdirin və ya deaktiv edin.`
        );
      }
    }

    // 2. Qiymət hesablanması
    const monthlyPrice = Number(plan.monthlyPrice || 0);
    let chargeAmount = 0;
    if (monthlyPrice > 0) {
      if (billingCycle === 'YEARLY') {
        chargeAmount = Math.round(monthlyPrice * 12 * 0.8); // 20% endirim
      } else {
        chargeAmount = monthlyPrice;
      }
    }

    const currentBalance = Number(company.availableBalance || 0);

    // 3. Balans yoxlanışı (Əgər paymentMethod === 'BALANCE' və qiymət > 0)
    if (chargeAmount > 0 && paymentMethod === 'BALANCE') {
      if (currentBalance < chargeAmount) {
        throw ApiError.badRequest(
          `Platforma balansınızda kifayət qədər vəsait yoxdur. Tələb olunan: ${chargeAmount} AZN, Mövcud balans: ${currentBalance.toFixed(2)} AZN. Zəhmət olmasa, Bank Kartı və ya B2B Faktura ilə ödəniş edin.`
        );
      }
    }

    const nextBillingDate = new Date();
    if (billingCycle === 'YEARLY') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);
    }

    // 4. İcra (Transaction)
    const result = await prisma.$transaction(async (tx) => {
      let updatedCompany = company;
      const isBankTransfer = chargeAmount > 0 && paymentMethod === 'BANK_TRANSFER';

      if (chargeAmount > 0 && paymentMethod === 'BALANCE') {
        const newBal = currentBalance - chargeAmount;
        updatedCompany = await tx.company.update({
          where: { id: companyId },
          data: {
            planId,
            availableBalance: newBal,
            nextBillingDate
          },
          include: { plan: true }
        });

        // Ledger Tranzaksiyası (Debet / Outflow)
        const txId = await generateUniqueId('TX', 'transaction');
        await tx.transaction.create({
          data: {
            id: txId,
            companyId,
            type: 'SUBSCRIPTION',
            amount: chargeAmount,
            commission: 0,
            netAmount: -chargeAmount,
            status: 'Completed',
            description: `${plan.name} abunəlik haqqı (Balansdan ödəniş, ${billingCycle === 'YEARLY' ? 'İllik -20%' : 'Aylıq'})`
          }
        });
      } else if (chargeAmount > 0 && paymentMethod === 'CARD') {
        // Onlayn kart ödənişi (Kapital/Pasha simulyasiyası - dərhal aktivləşir)
        updatedCompany = await tx.company.update({
          where: { id: companyId },
          data: {
            planId,
            nextBillingDate
          },
          include: { plan: true }
        });

        const txId = await generateUniqueId('TX', 'transaction');
        await tx.transaction.create({
          data: {
            id: txId,
            companyId,
            type: 'SUBSCRIPTION',
            amount: chargeAmount,
            commission: 0,
            netAmount: 0,
            status: 'Completed',
            description: `${plan.name} abunəlik haqqı (Onlayn Bank Kartı, ${billingCycle === 'YEARLY' ? 'İllik -20%' : 'Aylıq'})`
          }
        });
      } else if (isBankTransfer) {
        // B2B Bank Köçürməsi: Faktura yaradılır
        updatedCompany = await tx.company.update({
          where: { id: companyId },
          data: {
            planId,
            nextBillingDate
          },
          include: { plan: true }
        });
      } else {
        // Pulsuz plan (Starter)
        updatedCompany = await tx.company.update({
          where: { id: companyId },
          data: {
            planId,
            nextBillingDate
          },
          include: { plan: true }
        });
      }

      // Create SubscriptionPayment invoice
      const paymentId = await generateUniqueId('SPY', 'subscriptionPayment');
      const paymentStatus = isBankTransfer ? 'Pending' : 'Paid';

      await tx.subscriptionPayment.create({
        data: {
          id: paymentId,
          companyId,
          planId,
          amount: chargeAmount,
          status: paymentStatus,
          paymentDate: new Date(),
          dueDate: nextBillingDate
        }
      });

      return {
        updatedCompany,
        paymentId,
        paymentStatus,
        chargeAmount
      };
    });

    let successMsg = `Abunəlik planınız uğurla '${plan.name}' (${billingCycle === 'YEARLY' ? 'İllik' : 'Aylıq'}) olaraq aktivləşdirildi.`;
    if (paymentMethod === 'BANK_TRANSFER' && chargeAmount > 0) {
      successMsg = `'${plan.name}' planı üçün #${result.paymentId} nömrəli rəsmi hesablaşma fakturası tərtib edildi. Bank köçürməsi təsdiq edildikdən sonra status yenilənəcəkdir.`;
    }

    return {
      success: true,
      message: successMsg,
      paymentId: result.paymentId,
      status: result.paymentStatus,
      paymentMethod,
      company: result.updatedCompany
    };
  }

  // --- AUTOMATED CRON RENEWALS ---
  async processSubscriptionAutoRenewals() {
    const now = new Date();
    // 1. Vaxtı çatmış və avtomatik yenilənməsi aktiv olan şirkətləri tap
    const dueCompanies = await prisma.company.findMany({
      where: {
        planId: { not: null },
        autoRenewSubscription: true,
        nextBillingDate: { lte: now },
        deletedAt: null
      },
      include: {
        plan: true
      }
    });

    const results = {
      totalDue: dueCompanies.length,
      renewed: 0,
      failedDueToBalance: 0,
      freeExtended: 0,
      errors: 0
    };

    for (const company of dueCompanies) {
      try {
        const plan = company.plan;
        if (!plan) continue;

        const monthlyPrice = Number(plan.monthlyPrice || 0);
        const currentBalance = Number(company.availableBalance || 0);

        // Növbəti hesablaşma tarixi (30 gün sonra)
        const nextDate = new Date(company.nextBillingDate || now);
        nextDate.setDate(nextDate.getDate() + 30);

        if (monthlyPrice === 0) {
          // Pulsuz plan (Starter) - birbaşa 30 gün uzadılır
          await prisma.company.update({
            where: { id: company.id },
            data: { nextBillingDate: nextDate }
          });
          results.freeExtended++;
          continue;
        }

        // Ödənişli plan (Pro / Enterprise)
        if (currentBalance >= monthlyPrice) {
          // Balans kifayətdir: Balansdan çıxılır və uzadılır
          await prisma.$transaction(async (tx) => {
            const newBal = currentBalance - monthlyPrice;
            await tx.company.update({
              where: { id: company.id },
              data: {
                availableBalance: newBal,
                nextBillingDate: nextDate
              }
            });

            const txId = await generateUniqueId('TX', 'transaction');
            await tx.transaction.create({
              data: {
                id: txId,
                companyId: company.id,
                type: 'SUBSCRIPTION',
                amount: monthlyPrice,
                commission: 0,
                netAmount: -monthlyPrice,
                status: 'Completed',
                description: `${plan.name} abunəlik haqqı (Avtomatik aylıq yenilənmə)`
              }
            });

            const paymentId = await generateUniqueId('SPY', 'subscriptionPayment');
            await tx.subscriptionPayment.create({
              data: {
                id: paymentId,
                companyId: company.id,
                planId: plan.id,
                amount: monthlyPrice,
                status: 'Paid',
                paymentDate: new Date(),
                dueDate: nextDate
              }
            });
          });
          results.renewed++;
        } else {
          // Balans kifayət deyil: Overdue qeydi yaradılır
          const paymentId = await generateUniqueId('SPY', 'subscriptionPayment');
          await prisma.subscriptionPayment.create({
            data: {
              id: paymentId,
              companyId: company.id,
              planId: plan.id,
              amount: monthlyPrice,
              status: 'Overdue',
              paymentDate: new Date(),
              dueDate: company.nextBillingDate || now
            }
          });
          results.failedDueToBalance++;
          console.warn(`[Auto-Renew] Şirkət ${company.id} üçün balans çatışmadı (${currentBalance} < ${monthlyPrice}). 'Overdue' qeydi yaradıldı.`);
        }
      } catch (err) {
        results.errors++;
        console.error(`[Auto-Renew Error] Şirkət ${company.id}:`, err);
      }
    }

    return results;
  }
}

export const subscriptionsService = new SubscriptionsService();
export default subscriptionsService;
