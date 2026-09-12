import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';
import { generateExcel } from '../../utils/excel-generator.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import ApiError from '../../core/api.error.js';

function formatCompanyResponse(c) {
  if (!c) return null;

  let parsedSocialLinks = {};
  if (c.socialLinks) {
    try {
      parsedSocialLinks = typeof c.socialLinks === 'string' ? JSON.parse(c.socialLinks) : c.socialLinks;
    } catch {
      parsedSocialLinks = {};
    }
  }

  let parsedNotificationSettings = {
    emailBookings: true,
    emailPayouts: true,
    smsAlerts: false,
    marketingTips: false
  };
  if (c.notificationSettings) {
    try {
      parsedNotificationSettings = typeof c.notificationSettings === 'string' ? JSON.parse(c.notificationSettings) : c.notificationSettings;
    } catch {
      // default
    }
  }

  return {
    ...c,
    phone: c.phoneNumber || '',
    bankIban: c.iban || '',
    rating: Number(c.rating) || 0,
    availableBalance: Number(c.availableBalance) || 0,
    pendingBalance: Number(c.pendingBalance) || 0,
    socialLinks: parsedSocialLinks,
    notificationSettings: parsedNotificationSettings
  };
}

class CompaniesService {
  // Vendorun öz profilinə baxması
  async getCompanyProfile(id) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: { plan: true }
    });

    if (!company) {
      throw ApiError.notFound('Şirkət profili tapılmadı');
    }

    return formatCompanyResponse(company);
  }

  // Vendorun öz profilini yeniləməsi
  async updateCompanyProfile(id, data) {
    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.legalName !== undefined) updateData.legalName = data.legalName;
    if (data.phoneNumber !== undefined || data.phone !== undefined) {
      updateData.phoneNumber = data.phoneNumber !== undefined ? data.phoneNumber : data.phone;
    }
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.workingHours !== undefined) updateData.workingHours = data.workingHours;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl;
    
    if (data.socialLinks !== undefined) {
      updateData.socialLinks = typeof data.socialLinks === 'object' ? JSON.stringify(data.socialLinks) : data.socialLinks;
    }

    if (data.iban !== undefined || data.bankIban !== undefined) {
      updateData.iban = data.iban !== undefined ? data.iban : data.bankIban;
    }
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.bankVoen !== undefined) updateData.bankVoen = data.bankVoen;
    if (data.bankCode !== undefined) updateData.bankCode = data.bankCode;
    if (data.swiftBic !== undefined) updateData.swiftBic = data.swiftBic;
    if (data.payoutAccount !== undefined) updateData.payoutAccount = data.payoutAccount;
    if (data.accountantName !== undefined) updateData.accountantName = data.accountantName;
    if (data.accountantPhone !== undefined) updateData.accountantPhone = data.accountantPhone;

    if (data.notificationSettings !== undefined) {
      updateData.notificationSettings = typeof data.notificationSettings === 'object' ? JSON.stringify(data.notificationSettings) : data.notificationSettings;
    }

    const updated = await prisma.company.update({
      where: { id },
      data: updateData,
      include: { plan: true }
    });

    return formatCompanyResponse(updated);
  }

  // Təhlükəsizlik: Şifrənin dəyişdirilməsi
  async changePassword(userId, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Cari və yeni şifrə tələb olunur');
    }

    if (newPassword.length < 8) {
      throw ApiError.badRequest('Yeni şifrə ən azı 8 simvoldan ibarət olmalıdır');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw ApiError.notFound('İstifadəçi tapılmadı');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw ApiError.badRequest('Cari şifrə yanlışdır');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    return { message: 'Şifrəniz uğurla yeniləndi' };
  }

  // Şirkətin profil üzrə analitik göstəriciləri
  async getCompanyStats(companyId) {
    const [company, activeTours, totalBookings, totalTurnover] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        include: { plan: true }
      }),
      prisma.tour.count({
        where: { companyId, status: 'Active' }
      }),
      prisma.booking.count({
        where: { companyId }
      }),
      prisma.transaction.aggregate({
        where: { companyId, type: 'TICKET_SALE', status: 'Completed' },
        _sum: { amount: true }
      })
    ]);

    return {
      companyId,
      name: company?.name || '',
      rating: Number(company?.rating) || 4.9,
      status: company?.status || 'Active',
      planName: company?.plan?.name || 'Standart',
      activeTours,
      totalBookings,
      totalRevenue: Number(totalTurnover?._sum?.amount || 0),
      memberSince: company?.createdAt
    };
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
