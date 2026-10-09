import ApiError from '../core/api.error.js';
import { hasPermission } from '../config/permission.js';

export const roleMiddleware = (...requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('User not authenticated'));
      }

      const userRole = req.user.role || 'User';

      const isAllowed = requiredPermissions.some((perm) => hasPermission(userRole, perm));
      if (!isAllowed) {
        return next(ApiError.forbidden('You do not have permission to perform this action'));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default roleMiddleware;
