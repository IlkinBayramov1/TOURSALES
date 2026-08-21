import prisma from '../../config/db.js';
import { generateExcel } from '../../utils/excel-generator.js';
import { generateUniqueId } from '../../utils/id-generator.js';

class CompaniesService {
  // Vendorun öz profilinə baxması
  async getCompanyProfile(id) {
    return prisma.company.findUnique({
      where: { id },
      include: { plan: true }
    });
  }

  // Vendorun öz profilini yeniləməsi
  async updateCompanyProfile(id, data) {
    return prisma.company.update({
      where: { id },
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        email: data.email,
        address: data.address,
        voen: data.voen,
        iban: data.iban,
        bankName: data.bankName,
        payoutAccount: data.payoutAccount
      }
    });
  }

  // SuperAdmin üçün: Bütün şirkətlərin statistikası ilə siyahısı
  async getAllCompanies(filters = {}) {
    const { search, status } = filters;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { id: { contains: search } }
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        plan: true,
        tours: {
          where: { status: 'Active' }
        },
        transactions: {
          where: { type: 'TICKET_SALE', status: 'Completed' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return companies.map((c) => {
      const activeTourCount = c.tours.length;
      const totalTurnover = c.transactions.reduce((sum, t) => sum + t.amount, 0);

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phoneNumber: c.phoneNumber,
        voen: c.voen,
        address: c.address,
        iban: c.iban,
        bankName: c.bankName,
        status: c.status,
        rating: c.rating,
        createdAt: c.createdAt,
        activeTourCount,
        totalTurnover,
        planName: c.plan ? c.plan.name : 'Bilinmir'
      };
    });
  }

  // SuperAdmin üçün: Bir şirkətin bütün məlumatları və yaratdığı turlar
  async getCompanyDetails(id) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        plan: true,
        tours: true,
        users: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    if (!company) return null;

    // Şirkətin ümumi dövriyyəsini hesablayırıq
    const sales = await prisma.transaction.findMany({
      where: { companyId: id, type: 'TICKET_SALE', status: 'Completed' }
    });
    const totalTurnover = sales.reduce((sum, t) => sum + t.amount, 0);

    return {
      ...company,
      totalTurnover,
      tours: company.tours
    };
  }

  // SuperAdmin üçün: Manual yeni agentlik əlavə etmək
  async adminCreateCompany(data) {
    const id = await generateUniqueId('C', 'company');
    return prisma.company.create({
      data: {
        id,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: data.address,
        voen: data.voen,
        iban: data.iban,
        bankName: data.bankName,
        status: data.status || 'Active',
        planId: data.planId
      }
    });
  }

  // SuperAdmin üçün: Şirkətin statusunun dəyişdirilməsi (Təsdiqləmə / Ləğv / Blok)
  async adminUpdateCompanyStatus(id, status) {
    return prisma.company.update({
      where: { id },
      data: { status }
    });
  }

  // SuperAdmin üçün: Excel hesabat ixracı
  async exportCompaniesToExcel(filters = {}) {
    const companies = await this.getAllCompanies(filters);

    const columns = [
      { header: 'Şirkət ID', key: 'id', width: 15 },
      { header: 'Şirkət Adı', key: 'name', width: 25 },
      { header: 'Qoşulma Tarixi', key: 'createdAt', width: 20 },
      { header: 'Aktiv Tur Sayı', key: 'activeTourCount', width: 15 },
      { header: 'Ümumi Dövriyyə (AZN)', key: 'totalTurnover', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'VÖEN', key: 'voen', width: 15 },
      { header: 'IBAN', key: 'iban', width: 25 },
      { header: 'Bank Adı', key: 'bankName', width: 20 }
    ];

    const formattedData = companies.map((c) => ({
      id: c.id,
      name: c.name,
      createdAt: c.createdAt.toISOString().split('T')[0],
      activeTourCount: c.activeTourCount,
      totalTurnover: c.totalTurnover,
      status: c.status,
      voen: c.voen || 'Bilinmir',
      iban: c.iban || 'Bilinmir',
      bankName: c.bankName || 'Bilinmir'
    }));

    return generateExcel(formattedData, columns, 'Agentliklər');
  }
}

export const companiesService = new CompaniesService();
export default companiesService;
