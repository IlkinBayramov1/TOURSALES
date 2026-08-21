import ApiError from '../../core/api.error.js';

export const validateCompany = (req, res, next) => {
  const { name } = req.body;
  if (!name) {
    return next(ApiError.badRequest('Şirkət adı (name) vacibdir.'));
  }
  next();
};
