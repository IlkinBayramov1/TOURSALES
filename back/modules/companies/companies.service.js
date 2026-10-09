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
  async updateCompanyProfile(id, data, user = null) {
    const previous = await prisma.company.findUnique({
      where: { id }
    });

    if (!previous) {
      throw ApiError.notFound('Şirkət profili tapılmadı');
    }

    // Əgər dəyişikliyi edən ACCOUNTANT-dırsa, o yalnız bank və hesablaşma rekvizitlərini dəyişə bilər
    if (user?.agencyRole === 'ACCOUNTANT') {
      if (data.name !== undefined && data.name.trim() !== previous.name) {
        throw ApiError.forbidden('Mühasib şirkətin adını dəyişə bilməz. Bu əməliyyat üçün rəhbərə müraciət edin.');
      }
      if (data.legalName !== undefined && data.legalName.trim() !== (previous.legalName || '')) {
        throw ApiError.forbidden('Mühasib şirkətin rəsmi hüquqi adını dəyişə bilməz.');
      }
    }

    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.legalName !== undefined) updateData.legalName = data.legalName.trim();
    if (data.phoneNumber !== undefined || data.phone !== undefined) {
      updateData.phoneNumber = (data.phoneNumber !== undefined ? data.phoneNumber : data.phone).trim();
    }
    if (data.email !== undefined) updateData.email = data.email.trim();
    if (data.address !== undefined) updateData.address = data.address.trim();
    if (data.city !== undefined) updateData.city = data.city.trim();
    if (data.website !== undefined) updateData.website = data.website.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.workingHours !== undefined) updateData.workingHours = data.workingHours.trim();
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl;
    
    if (data.socialLinks !== undefined) {
      updateData.socialLinks = typeof data.socialLinks === 'object' ? JSON.stringify(data.socialLinks) : data.socialLinks;
    }

    if (data.iban !== undefined || data.bankIban !== undefined) {
      const rawIban = data.iban !== undefined ? data.iban : data.bankIban;
      updateData.iban = rawIban.replace(/\s+/g, '').toUpperCase();
    }
    if (data.bankName !== undefined) updateData.bankName = data.bankName.trim();
    if (data.bankVoen !== undefined) updateData.bankVoen = data.bankVoen.trim();
    if (data.bankCode !== undefined) updateData.bankCode = data.bankCode.trim();
    if (data.swiftBic !== undefined) updateData.swiftBic = data.swiftBic.replace(/\s+/g, '').toUpperCase();
    if (data.payoutAccount !== undefined) updateData.payoutAccount = data.payoutAccount.replace(/\s+/g, '').toUpperCase();
    if (data.accountantName !== undefined) updateData.accountantName = data.accountantName.trim();
    if (data.accountantPhone !== undefined) updateData.accountantPhone = data.accountantPhone.trim();

    if (data.notificationSettings !== undefined) {
      updateData.notificationSettings = typeof data.notificationSettings === 'object' ? JSON.stringify(data.notificationSettings) : data.notificationSettings;
    }

    // Bank rekvizitlərinin dəyişdiyini aşkarlayaq
    const bankingChanged =
      (updateData.iban && updateData.iban !== previous.iban) ||
      (updateData.bankName && updateData.bankName !== previous.bankName) ||
      (updateData.payoutAccount && updateData.payoutAccount !== previous.payoutAccount) ||
      (updateData.swiftBic && updateData.swiftBic !== previous.swiftBic) ||
      (updateData.bankVoen && updateData.bankVoen !== previous.bankVoen);

    const updated = await prisma.company.update({
      where: { id },
      data: updateData,
      include: { plan: true }
    });

    // AuditLog Qeydiyyatı
    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: id,
        entityName: 'Company',
        entityId: id,
        action: bankingChanged ? 'UPDATE_BANKING_DETAILS' : 'UPDATE_COMPANY_PROFILE',
        performedBy: `${user?.name || user?.email || 'Rəhbər'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        oldValues: JSON.stringify({
          name: previous.name,
          legalName: previous.legalName,
          email: previous.email,
          iban: previous.iban,
          payoutAccount: previous.payoutAccount,
          bankName: previous.bankName
        }),
        newValues: JSON.stringify(updateData)
      }
    }).catch((err) => console.error('[AuditLog] Company profile update error:', err));

    return formatCompanyResponse(updated);
  }

  // Təhlükəsizlik: Şifrənin dəyişdirilməsi
  async changePassword(userId, { currentPassword, newPassword }, user = null) {
    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Cari və yeni şifrə tələb olunur');
    }

    if (newPassword.length < 8) {
      throw ApiError.badRequest('Yeni şifrə ən azı 8 simvoldan ibarət olmalıdır');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      throw ApiError.notFound('İstifadəçi tapılmadı');
    }

    const isMatch = await bcrypt.compare(currentPassword, targetUser.password);
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

    // AuditLog Qeydiyyatı
    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: targetUser.companyId || 'SYSTEM',
        entityName: 'User',
        entityId: userId,
        action: 'CHANGE_PASSWORD',
        performedBy: `${user?.name || targetUser.name || targetUser.email} (${(user?.agencyRole || targetUser.role || 'VENDOR').toUpperCase()})`,
        newValues: JSON.stringify({ passwordChangedAt: new Date() })
      }
    }).catch((err) => console.error('[AuditLog] Password change error:', err));

    return { message: 'Şifrəniz uğurla yeniləndi' };
  }

  // Təhlükəsizlik: Aktiv Sessiyaların Gətirilməsi
  async getActiveSessions(userId, currentIp = '127.0.0.1', currentUserAgent = '') {
    const sessions = await prisma.refreshSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (sessions.length === 0) {
      return [
        {
          id: 'sess-current',
          ipAddress: currentIp || '127.0.0.1',
          device: 'Cari Brauzer (Windows PC)',
          userAgent: currentUserAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: new Date(),
          isCurrent: true,
          status: 'Aktiv'
        }
      ];
    }

    return sessions.map((s, idx) => {
      const ua = s.userAgent || '';
      let deviceName = 'Veb Brauzer';
      if (ua.includes('Windows')) deviceName = 'Windows PC (Chrome / Edge)';
      else if (ua.includes('Macintosh')) deviceName = 'MacBook (Safari / Chrome)';
      else if (ua.includes('iPhone') || ua.includes('iPad')) deviceName = 'Apple iOS Mobil Cihazı';
      else if (ua.includes('Android')) deviceName = 'Android Mobil Cihazı';

      return {
        id: s.id,
        ipAddress: s.ipAddress || '127.0.0.1',
        device: deviceName,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        isCurrent: idx === 0,
        status: 'Aktiv'
      };
    });
  }

  // Təhlükəsizlik: Digər Bütün Sessiyaların Ləğv Edilməsi (Revoke Sessions)
  async revokeOtherSessions(userId, currentSessionId = null, user = null) {
    const whereClause = {
      userId,
      revokedAt: null
    };
    if (currentSessionId && currentSessionId !== 'sess-current') {
      whereClause.id = { not: currentSessionId };
    }

    const res = await prisma.refreshSession.updateMany({
      where: whereClause,
      data: {
        revokedAt: new Date(),
        revokeReason: 'USER_REVOKED_OTHER_SESSIONS'
      }
    });

    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: user?.companyId || 'SYSTEM',
        entityName: 'RefreshSession',
        entityId: userId,
        action: 'REVOKE_SESSIONS',
        performedBy: `${user?.name || user?.email || 'İstifadəçi'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        newValues: JSON.stringify({ revokedCount: res.count, revokedAt: new Date() })
      }
    }).catch((err) => console.error('[AuditLog] Revoke sessions error:', err));

    return {
      success: true,
      revokedCount: res.count,
      message: 'Digər bütün aktiv sessiyalardan uğurla çıxış edildi.'
    };
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

  // İctimai müştəri vitrini: Təsdiqlənmiş lisenziyalı şirkətin profili və aktiv turları
  async getPublicCompanyProfile(id) {
    const company = await prisma.company.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        legalName: true,
        logoUrl: true,
        coverUrl: true,
        description: true,
        rating: true,
        city: true,
        address: true,
        phoneNumber: true,
        email: true,
        website: true,
        workingHours: true,
        socialLinks: true,
        voen: true,
        status: true,
        createdAt: true,
        tours: {
          where: { status: 'Active', deletedAt: null },
          select: {
            id: true,
            title: true,
            type: true,
            price: true,
            images: true,
            startDate: true,
            destinationCountry: true,
            busCapacity: true,
            maxParticipants: true
          },
          orderBy: { createdAt: 'desc' },
          take: 12
        }
      }
    });

    if (!company) {
      throw ApiError.notFound('Şirkət profili tapılmadı');
    }

    const formattedTours = (company.tours || []).map((t) => {
      let parsedImages = [];
      try {
        parsedImages = typeof t.images === 'string' ? JSON.parse(t.images) : t.images;
      } catch {
        parsedImages = [t.images];
      }
      return {
        ...t,
        price: Number(t.price) || 0,
        images: parsedImages
      };
    });

    return {
      ...formatCompanyResponse(company),
      tours: formattedTours
    };
  }

  // İctimai tərəfdaş şirkətlərin kataloq siyahısı (Web directory)
  async getPublicCompanies(limit = 20) {
    const companies = await prisma.company.findMany({
      where: { status: 'Active', deletedAt: null },
      select: {
        id: true,
        name: true,
        legalName: true,
        logoUrl: true,
        coverUrl: true,
        description: true,
        rating: true,
        city: true,
        address: true,
        phoneNumber: true,
        email: true,
        website: true,
        workingHours: true,
        _count: {
          select: {
            tours: { where: { status: 'Active', deletedAt: null } }
          }
        }
      },
      orderBy: { rating: 'desc' },
      take: parseInt(limit, 10) || 20
    });

    return companies.map((c) => ({
      ...formatCompanyResponse(c),
      activeTourCount: c._count?.tours || 0
    }));
  }
}

export const companiesService = new CompaniesService();
export default companiesService;
