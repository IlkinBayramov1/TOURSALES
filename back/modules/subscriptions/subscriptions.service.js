import prisma from '../../config/db.js';
import { generateExcel } from '../../utils/excel-generator.js';
import { generateUniqueId } from '../../utils/id-generator.js';

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
}

export const subscriptionsService = new SubscriptionsService();
export default subscriptionsService;
