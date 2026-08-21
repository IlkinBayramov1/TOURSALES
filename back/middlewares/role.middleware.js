import ApiError from '../core/api.error.js';
import { hasPermission } from '../config/permission.js';

export const roleMiddleware = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('User not authenticated'));
      }

      const userRole = req.user.role || 'User';

      if (!hasPermission(userRole, requiredPermission)) {
        return next(ApiError.forbidden('You do not have permission to perform this action'));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default roleMiddleware;
