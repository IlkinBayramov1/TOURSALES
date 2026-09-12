import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import { ApiError } from '../../core/api.error.js';

class TeamsService {
  async getTeamMembers(companyId) {
    const users = await prisma.user.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        agencyRole: true,
        phoneNumber: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const members = users.map((u) => ({
      id: u.id,
      userId: u.id,
      companyId,
      name: u.name || 'Ad qeyd olunmayıb',
      email: u.email,
      role: (u.agencyRole || 'GUIDE').toUpperCase(),
      agencyRole: u.agencyRole || 'GUIDE',
      phoneNumber: u.phoneNumber || '—',
      status: u.status || 'Active',
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    }));

    const kpis = {
      total: members.length,
      managers: members.filter((m) => m.agencyRole === 'MANAGER').length,
      accountants: members.filter((m) => m.agencyRole === 'ACCOUNTANT').length,
      guides: members.filter((m) => m.agencyRole === 'GUIDE').length,
    };

    return { members, kpis };
  }

  async inviteMember(companyId, inviterUser, { name, email, phone, role, password }) {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      throw ApiError.badRequest('Bu e-poçt ünvanı ilə artıq sistemdə istifadəçi mövcuddur.');
    }

    const validRoles = ['MANAGER', 'ACCOUNTANT', 'GUIDE', 'OWNER'];
    const assignedRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : 'GUIDE';

    const plainPassword = password?.trim() || 'password123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const userId = await generateUniqueId('U', 'user');

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        hashAlgorithm: 'BCRYPT',
        role: 'Vendor',
        agencyRole: assignedRole,
        companyId,
        phoneNumber: phone?.trim() || null,
        status: 'Active',
        createdAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        agencyRole: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
      },
    });

    // Log to AuditLog
    try {
      const audId = await generateUniqueId('AUD', 'auditLog');
      await prisma.auditLog.create({
        data: {
          id: audId,
          tenantId: companyId,
          entityName: 'TeamMember',
          entityId: newUser.id,
          action: 'INVITE',
          performedBy: `${inviterUser?.name || 'Rəhbər'} (${inviterUser?.agencyRole || 'OWNER'})`,
          newValues: JSON.stringify({ name: newUser.name, email: newUser.email, role: assignedRole }),
          createdAt: new Date(),
        },
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }

    return {
      id: newUser.id,
      userId: newUser.id,
      companyId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.agencyRole,
      agencyRole: newUser.agencyRole,
      phoneNumber: newUser.phoneNumber || '—',
      status: newUser.status,
      createdAt: newUser.createdAt,
    };
  }

  async updateMember(companyId, inviterUser, memberId, { name, phone, role, status }) {
    const user = await prisma.user.findFirst({
      where: { id: memberId, companyId, deletedAt: null },
    });

    if (!user) {
      throw ApiError.notFound('Əməkdaş tapılmadı.');
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phoneNumber = phone?.trim() || null;
    if (role) {
      const validRoles = ['MANAGER', 'ACCOUNTANT', 'GUIDE', 'OWNER'];
      if (validRoles.includes(role.toUpperCase())) {
        updateData.agencyRole = role.toUpperCase();
      }
    }
    if (status) {
      const validStatuses = ['Active', 'Suspended'];
      if (validStatuses.includes(status)) {
        updateData.status = status;
      }
    }

    const updated = await prisma.user.update({
      where: { id: memberId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        agencyRole: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
      },
    });

    // Log update
    try {
      const audId = await generateUniqueId('AUD', 'auditLog');
      await prisma.auditLog.create({
        data: {
          id: audId,
          tenantId: companyId,
          entityName: 'TeamMember',
          entityId: memberId,
          action: 'UPDATE',
          performedBy: `${inviterUser?.name || 'Rəhbər'} (${inviterUser?.agencyRole || 'OWNER'})`,
          oldValues: JSON.stringify({ role: user.agencyRole, status: user.status }),
          newValues: JSON.stringify(updateData),
          createdAt: new Date(),
        },
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }

    return updated;
  }

  async removeMember(companyId, inviterUser, memberId) {
    const user = await prisma.user.findFirst({
      where: { id: memberId, companyId, deletedAt: null },
    });

    if (!user) {
      throw ApiError.notFound('Əməkdaş tapılmadı.');
    }

    if (user.agencyRole === 'OWNER') {
      throw ApiError.badRequest('Şirkət sahibini komandadan silmək mümkün deyil.');
    }

    await prisma.user.update({
      where: { id: memberId },
      data: {
        companyId: null,
        deletedAt: new Date(),
        status: 'Suspended',
      },
    });

    // Log removal
    try {
      const audId = await generateUniqueId('AUD', 'auditLog');
      await prisma.auditLog.create({
        data: {
          id: audId,
          tenantId: companyId,
          entityName: 'TeamMember',
          entityId: memberId,
          action: 'REMOVE',
          performedBy: `${inviterUser?.name || 'Rəhbər'} (${inviterUser?.agencyRole || 'OWNER'})`,
          oldValues: JSON.stringify({ name: user.name, email: user.email, role: user.agencyRole }),
          createdAt: new Date(),
        },
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }

    return { success: true, message: 'Əməkdaş komandadan uğurla silindi.' };
  }

  getPermissionsMatrix() {
    return [
      {
        module: 'Turların İdarəsi (Tours)',
        description: 'Tur yaratmaq, redaktə etmək, qiymət və proqramı dəyişmək',
        owner: 'Tam Giriş (Yarat / Redaktə / Sil)',
        manager: 'Tam Giriş (Yarat / Redaktə)',
        accountant: 'Yalnız Baxış',
        guide: 'Giriş Yoxdur',
      },
      {
        module: 'Sifarişlər və Minik (Bookings)',
        description: 'Bilet satışları, sərnişin manifesti və yer nömrələri',
        owner: 'Tam Giriş (Bax / İxrac / Ləğv)',
        manager: 'Tam Giriş (Bax / İxrac / Ləğv)',
        accountant: 'Yalnız Baxış & Maliyyə İxracı',
        guide: 'Yalnız Sərnişin Siyahısı',
      },
      {
        module: 'QR Bilet Check-in (Minik Skaneri)',
        description: 'Avtobusa minik zamanı QR kodların skan edilməsi',
        owner: 'Bəli',
        manager: 'Bəli',
        accountant: 'Xeyr',
        guide: 'Əsas Səlahiyyət (Bəli)',
      },
      {
        module: 'Maliyyə Balansı və Çıxarış (Finance & Payouts)',
        description: 'Balans, bank hesabına çıxarış sorğuları və dövriyyə',
        owner: 'Tam Giriş & Təsdiq',
        manager: 'Yalnız İcmal Göstəriciləri',
        accountant: 'Tam Giriş (Sorğu Göndər / İxrac)',
        guide: 'Giriş Yoxdur',
      },
      {
        module: 'Abunəlik Planları və Fakturalar (Subscriptions)',
        description: 'Tarif dəyişimi, ödəniş fakturaları və invoyslar',
        owner: 'Tam Giriş & Plan Keçidi',
        manager: 'Giriş Yoxdur',
        accountant: 'Fakturalara Baxış & Çap',
        guide: 'Giriş Yoxdur',
      },
      {
        module: 'Komanda və Giriş İcazələri (RBAC Team)',
        description: 'Yeni işçilər əlavə etmək, rolları dəyişmək, şifrələr',
        owner: 'Tam Nəzarət',
        manager: 'Yalnız Bələdçi Əlavə Etmək',
        accountant: 'Giriş Yoxdur',
        guide: 'Giriş Yoxdur',
      },
      {
        module: 'API Açarları və Sistem İnteqrasiyası',
        description: 'Tərəfdaş sayt və proqramlar üçün API açarları',
        owner: 'Tam Giriş',
        manager: 'Giriş Yoxdur',
        accountant: 'Giriş Yoxdur',
        guide: 'Giriş Yoxdur',
      },
    ];
  }

  async getActivityLogs(companyId) {
    const logs = await prisma.auditLog.findMany({
      where: { tenantId: companyId },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    return logs.map((l) => ({
      id: l.id,
      entityName: l.entityName,
      entityId: l.entityId,
      action: l.action,
      performedBy: l.performedBy || 'Sistem',
      details: l.newValues || l.oldValues || '—',
      createdAt: l.createdAt,
    }));
  }
}

export const teamsService = new TeamsService();
export default teamsService;
