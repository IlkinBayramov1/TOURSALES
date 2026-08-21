import ApiError from '../../core/api.error.js';

export const validateLoyalty = (req, res, next) => {
  const { points, userId } = req.body;
  if (points === undefined || !userId) {
    return next(ApiError.badRequest('İstifadəçi ID (userId) və xallar (points) vacibdir.'));
  }
  next();
};
