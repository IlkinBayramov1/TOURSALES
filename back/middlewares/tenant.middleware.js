import ApiError from '../core/api.error.js';
import { ROLES } from '../config/constants.js';

export class TenantContext {
  constructor(req) {
    this.user = req.user || null;
    this.tenantId = req.user?.companyId || null;
    this.role = req.user?.role || 'User';
    this.isSuperAdmin = this.role === ROLES.SUPERADMIN;
  }

  // Scopes a Prisma query filter object with tenant isolation and soft delete
  applyTenantScope(where = {}, options = { allowSuperAdminGlobal: true }) {
    const scopedWhere = { ...where };

    // Standard soft-delete filter
    scopedWhere.deletedAt = null;

    // Multi-tenant company scope
    if (!this.isSuperAdmin || !options.allowSuperAdminGlobal) {
      if (!this.tenantId) {
        throw ApiError.forbidden('Çıxarış üçün şirkət (Tenant) identifikasiyası tapılmadı.');
      }
      scopedWhere.companyId = this.tenantId;
    }

    return scopedWhere;
  }

  // Verifies if an entity belongs to the current tenant
  validateAccess(entity) {
    if (!entity) return false;
    if (this.isSuperAdmin) return true;
    if (entity.companyId && entity.companyId !== this.tenantId) {
      throw ApiError.forbidden('Digər şirkətə (Tenant-a) aid resurslara giriş qadağandır.');
    }
    return true;
  }
}

export const tenantGuard = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Autentifikasiya olunmayıb.'));
  }
  
  req.tenantContext = new TenantContext(req);
  next();
};

export default tenantGuard;
