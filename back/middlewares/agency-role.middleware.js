import ApiError from '../core/api.error.js';

/**
 * Agency / Vendor daxili RBAC yoxlayıcı middleware.
 * Yoxlayır: req.user.agencyRole ('OWNER', 'MANAGER', 'ACCOUNTANT', 'GUIDE')
 * SuperAdmin platforma istifadəçilərinə həmişə icazə verilir.
 */
export const requireAgencyRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('İstifadəçi autentifikasiya olunmayıb.'));
      }

      // Platforma SuperAdmin-i hər şeyə icazəlidir
      if (req.user.role === 'SuperAdmin') {
        return next();
      }

      const userAgencyRole = (req.user.agencyRole || 'OWNER').toUpperCase();
      const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

      if (!normalizedAllowed.includes(userAgencyRole)) {
        return next(
          ApiError.forbidden(
            `Bu əməliyyatı icra etmək üçün səlahiyyətiniz çatmır. Tələb olunan rol: ${allowedRoles.join(', ')}. Sizin rolunuz: ${userAgencyRole}`
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default requireAgencyRole;
