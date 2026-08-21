import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import env from '../config/env.js';
import ApiError from '../core/api.error.js';

export const authMiddleware = (options = {}) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

      if (!token) {
        if (options.isPublic) {
          return next();
        }
        return next(ApiError.unauthorized('Authorization token required'));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, env.JWT_SECRET);
      } catch (err) {
        if (options.isPublic) {
          return next();
        }
        return next(ApiError.unauthorized('Invalid or expired token'));
      }

      // 2FA müvəqqəti tokenidirsə, yalnız 2FA login endpointinə buraxılsın
      if (decoded.twoFactorTemp && !req.path.includes('/login/2fa')) {
        return next(ApiError.unauthorized('2FA verification required'));
      }

      // Sessiyanın verilənlər bazasında aktiv olduğunu yoxlayırıq
      const sessionExists = await prisma.session.findFirst({
        where: { userId: decoded.id, token }
      });

      if (!sessionExists) {
        if (options.isPublic) {
          return next();
        }
        return next(ApiError.unauthorized('Oturum sonlandırılıb və ya etibarsızdır. Yenidən daxil olun.'));
      }

      // İstifadəçinin bazada mövcudluğunu yoxlayırıq
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        if (options.isPublic) {
          return next();
        }
        return next(ApiError.unauthorized('User not found'));
      }

      req.user = user;
      req.token = token; // Müvafiq olaraq sessiyanı silmək (logout) üçün
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default authMiddleware;
