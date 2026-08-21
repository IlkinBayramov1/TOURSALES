import ApiError from '../../core/api.error.js';

export const validateAd = (req, res, next) => {
  const { title } = req.body;
  if (!title) {
    return next(ApiError.badRequest('Reklam başlığı (title) vacibdir.'));
  }
  next();
};
