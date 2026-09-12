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

    return {
      companyId: company.id,
      companyName: company.name,
      planId: plan ? plan.id : null,
      planName: plan ? plan.name : 'Peşəkar (Pro)',
      monthlyPrice: plan ? Number(plan.monthlyPrice) : 49,
      domesticCommission: plan ? Number(plan.domesticCommission) : 5.0,
      foreignCommission: plan ? Number(plan.foreignCommission) : 7.0,
      commissionRate: plan ? Number(plan.domesticCommission) : 5.0,
      features: parsedFeatures,
      maxTours: plan?.name?.includes('Starter') ? 5 : plan?.name?.includes('Pro') ? 50 : -1,
      activeToursCount,
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
    const payFromBalance = payload?.payFromBalance !== false;

    const [company, plan] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.subscriptionPlan.findUnique({ where: { id: planId } })
    ]);

    if (!company) throw ApiError.notFound('Şirkət tapılmadı.');
    if (!plan) throw ApiError.notFound('Abunəlik planı tapılmadı.');

    const monthlyPrice = Number(plan.monthlyPrice || 0);
    let chargeAmount = 0;

    if (monthlyPrice > 0) {
      if (billingCycle === 'YEARLY') {
        chargeAmount = Math.round(monthlyPrice * 12 * 0.8); // 20% discount
      } else {
        chargeAmount = monthlyPrice;
      }
    }

    const currentBalance = Number(company.availableBalance || 0);

    if (chargeAmount > 0 && payFromBalance) {
      if (currentBalance < chargeAmount) {
        throw ApiError.badRequest(
          `Balansınızda kifayət qədər vəsait yoxdur. Tələb olunan: ${chargeAmount} AZN, Mövcud balans: ${currentBalance.toFixed(2)} AZN.`
        );
      }
    }

    const nextBillingDate = new Date();
    if (billingCycle === 'YEARLY') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);
    }

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      let updatedCompany = company;
      if (chargeAmount > 0 && payFromBalance) {
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

        // Ledger Transaction
        const txId = await generateUniqueId('TX', 'transaction');
        await tx.transaction.create({
          data: {
            id: txId,
            companyId,
            type: 'SUBSCRIPTION',
            amount: chargeAmount,
            commission: 0,
            netAmount: chargeAmount,
            status: 'Completed',
            description: `${plan.name} abunəlik haqqı (${billingCycle === 'YEARLY' ? 'İllik -20%' : 'Aylıq'})`
          }
        });
      } else {
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
      await tx.subscriptionPayment.create({
        data: {
          id: paymentId,
          companyId,
          planId,
          amount: chargeAmount,
          status: 'Paid',
          paymentDate: new Date(),
          dueDate: nextBillingDate
        }
      });

      return updatedCompany;
    });

    return {
      success: true,
      message: `Abunəlik planınız uğurla '${plan.name}' (${billingCycle === 'YEARLY' ? 'İllik' : 'Aylıq'}) olaraq yeniləndi.`,
      company: result
    };
  }
}

export const subscriptionsService = new SubscriptionsService();
export default subscriptionsService;
