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
        guidedTours: {
          where: { deletedAt: null, status: 'Active' },
          select: { id: true },
        },
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
      assignedToursCount: u.guidedTours ? u.guidedTours.length : 0,
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
    const inviterRole = (inviterUser?.agencyRole || 'OWNER').toUpperCase();
    if (inviterRole !== 'OWNER' && inviterRole !== 'MANAGER') {
      throw ApiError.forbidden('Yalnız şirkət rəhbəri və ya meneceri yeni əməkdaş əlavə edə bilər.');
    }

    const assignedRole = (role || 'GUIDE').toUpperCase();
    if (inviterRole === 'MANAGER' && (assignedRole === 'OWNER' || assignedRole === 'MANAGER')) {
      throw ApiError.forbidden('Menecer yalnız Bələdçi və ya Mühasib dəvət edə bilər.');
    }

    // 1. Abunəlik planı üzrə komanda üzvü kvotasının yoxlanılması (SaaS Quota Guard)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    });

    if (company) {
      const planName = company.plan?.name || 'Başlanğıc (Starter)';
      let maxMembers = 1;
      if (planName.includes('Pro')) maxMembers = 5;
      else if (planName.includes('Enterprise')) maxMembers = -1;

      if (maxMembers !== -1) {
        const activeMembersCount = await prisma.user.count({
          where: { companyId, deletedAt: null },
        });
        if (activeMembersCount >= maxMembers) {
          throw ApiError.badRequest(
            `Abunəlik planınızın komanda üzvü limiti (${maxMembers} nəfər) dolmuşdur. Daha çox əməkdaş əlavə etmək üçün planınızı yüksəldin.`
          );
        }
      }
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      throw ApiError.badRequest('Bu e-poçt ünvanı ilə artıq sistemdə istifadəçi mövcuddur.');
    }

    const validRoles = ['MANAGER', 'ACCOUNTANT', 'GUIDE', 'OWNER'];
    const safeRole = validRoles.includes(assignedRole) ? assignedRole : 'GUIDE';

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
        agencyRole: safeRole,
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
          performedBy: `${inviterUser?.name || 'Rəhbər'} (${inviterRole})`,
          newValues: JSON.stringify({ name: newUser.name, email: newUser.email, role: safeRole }),
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
      assignedToursCount: 0,
    };
  }

  async updateMember(companyId, inviterUser, memberId, { name, phone, role, status }) {
    const inviterRole = (inviterUser?.agencyRole || 'OWNER').toUpperCase();
    const user = await prisma.user.findFirst({
      where: { id: memberId, companyId, deletedAt: null },
    });

    if (!user) {
      throw ApiError.notFound('Əməkdaş tapılmadı.');
    }

    if (user.agencyRole === 'OWNER' && inviterRole !== 'OWNER') {
      throw ApiError.forbidden('Şirkət rəhbərinin məlumatlarını yalnız rəhbər özü redaktə edə bilər.');
    }

    if (role && role.toUpperCase() === 'OWNER' && inviterRole !== 'OWNER') {
      throw ApiError.forbidden('Yalnız şirkət rəhbəri rəhbər təyin edə bilər.');
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
        if (user.agencyRole === 'OWNER' && status === 'Suspended') {
          throw ApiError.badRequest('Şirkət rəhbərinin statusu dondurula bilməz.');
        }
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
          performedBy: `${inviterUser?.name || 'Rəhbər'} (${inviterRole})`,
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
    const inviterRole = (inviterUser?.agencyRole || 'OWNER').toUpperCase();
    if (inviterRole !== 'OWNER' && inviterRole !== 'MANAGER') {
      throw ApiError.forbidden('Əməkdaşı silmək üçün səlahiyyətiniz çatmır.');
    }

    const user = await prisma.user.findFirst({
      where: { id: memberId, companyId, deletedAt: null },
    });

    if (!user) {
      throw ApiError.notFound('Əməkdaş tapılmadı.');
    }

    if (user.agencyRole === 'OWNER') {
      throw ApiError.badRequest('Şirkət sahibini komandadan silmək mümkün deyil.');
    }

    if (user.agencyRole === 'MANAGER' && inviterRole !== 'OWNER') {
      throw ApiError.forbidden('Meneceri yalnız şirkət rəhbəri silə bilər.');
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
          performedBy: `${inviterUser?.name || 'Rəhbər'} (${inviterRole})`,
          oldValues: JSON.stringify({ name: user.name, email: user.email, role: user.agencyRole }),
          createdAt: new Date(),
        },
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }

    return { success: true, message: 'Əməkdaş komandadan uğurla silindi.' };
  }

  async resetMemberPassword(companyId, inviterUser, memberId, newPassword) {
    const inviterRole = (inviterUser?.agencyRole || 'OWNER').toUpperCase();
    if (inviterRole !== 'OWNER' && inviterRole !== 'MANAGER') {
      throw ApiError.forbidden('Şifrəni sıfırlamaq üçün səlahiyyətiniz çatmır.');
    }

    const user = await prisma.user.findFirst({
      where: { id: memberId, companyId, deletedAt: null },
    });

    if (!user) {
      throw ApiError.notFound('Əməkdaş tapılmadı.');
    }

    if (user.agencyRole === 'OWNER' && inviterUser?.id !== user.id && inviterRole !== 'OWNER') {
      throw ApiError.forbidden('Şirkət rəhbərinin şifrəsini yalnız rəhbər özü dəyişə bilər.');
    }

    // Əgər yeni şifrə verilməyibsə, təhlükəsiz müvəqqəti şifrə generasiya et
    const plainPassword = newPassword?.trim() || `Pass#${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await prisma.user.update({
      where: { id: memberId },
      data: { password: hashedPassword, hashAlgorithm: 'BCRYPT' },
    });

    // Audit log
    try {
      const audId = await generateUniqueId('AUD', 'auditLog');
      await prisma.auditLog.create({
        data: {
          id: audId,
          tenantId: companyId,
          entityName: 'TeamMember',
          entityId: memberId,
          action: 'RESET_PASSWORD',
          performedBy: `${inviterUser?.name || 'Rəhbər'} (${inviterRole})`,
          newValues: JSON.stringify({ email: user.email, note: 'Şifrə rəhbərlik tərəfindən sıfırlandı' }),
          createdAt: new Date(),
        },
      });
    } catch (e) {
      console.error('Audit log error:', e);
    }

    return {
      success: true,
      message: `'${user.name}' adlı əməkdaşın şifrəsi uğurla yeniləndi.`,
      tempPassword: plainPassword,
      email: user.email,
      name: user.name,
    };
  }

  async toggleMemberStatus(companyId, inviterUser, memberId) {
    const inviterRole = (inviterUser?.agencyRole || 'OWNER').toUpperCase();
    if (inviterRole !== 'OWNER' && inviterRole !== 'MANAGER') {
      throw ApiError.forbidden('Statusu dəyişmək üçün səlahiyyətiniz çatmır.');
    }

    const user = await prisma.user.findFirst({
      where: { id: memberId, companyId, deletedAt: null },
    });

    if (!user) {
      throw ApiError.notFound('Əməkdaş tapılmadı.');
    }

    if (user.agencyRole === 'OWNER') {
      if (inviterRole !== 'OWNER') {
        throw ApiError.forbidden('Şirkət rəhbərinin statusunu dəyişmək səlahiyyətiniz yoxdur.');
      }
      throw ApiError.badRequest('Şirkət rəhbərinin statusu dondurula bilməz.');
    }

    if (user.agencyRole === 'MANAGER' && inviterRole !== 'OWNER') {
      throw ApiError.forbidden('Menecerin statusunu yalnız şirkət rəhbəri dəyişə bilər.');
    }

    const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';

    const updated = await prisma.user.update({
      where: { id: memberId },
      data: { status: nextStatus },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        agencyRole: true,
      },
    });

    // Audit log
    try {
      const audId = await generateUniqueId('AUD', 'auditLog');
      await prisma.auditLog.create({
        data: {
          id: audId,
          tenantId: companyId,
          entityName: 'TeamMember',
          entityId: memberId,
          action: nextStatus === 'Suspended' ? 'SUSPEND' : 'ACTIVATE',
          performedBy: `${inviterUser?.name || 'Rəhbər'} (${inviterRole})`,
          oldValues: JSON.stringify({ status: user.status }),
          newValues: JSON.stringify({ status: nextStatus }),
          createdAt: new Date(),
        },
      });
    } catch (e) {
      console.error('Audit log error:', e);
    }

    return {
      success: true,
      status: updated.status,
      message: nextStatus === 'Suspended' 
        ? `'${user.name}' adlı əməkdaşın girişi donduruldu.`
        : `'${user.name}' adlı əməkdaşın girişi yenidən aktivləşdirildi.`,
      user: updated,
    };
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

  async getActivityLogs(companyId, query = {}) {
    const { action, search, limit = 50 } = query;
    const where = { tenantId: companyId };

    if (action && action !== 'ALL') {
      where.action = action;
    }

    if (search) {
      where.OR = [
        { performedBy: { contains: search } },
        { entityName: { contains: search } },
        { newValues: { contains: search } },
        { oldValues: { contains: search } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, Number(limit))),
    });

    return logs.map((l) => ({
      id: l.id,
      entityName: l.entityName,
      entityId: l.entityId,
      action: l.action,
      performedBy: l.performedBy || 'Sistem',
      oldValues: l.oldValues,
      newValues: l.newValues,
      details: l.newValues || l.oldValues || '—',
      createdAt: l.createdAt,
    }));
  }
}

export const teamsService = new TeamsService();
export default teamsService;

