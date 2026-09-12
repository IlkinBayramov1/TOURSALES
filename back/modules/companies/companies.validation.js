import ApiError from '../../core/api.error.js';

export const validateCompany = (req, res, next) => {
  if (req.body.name !== undefined && !String(req.body.name).trim()) {
    return next(ApiError.badRequest('Şirkət adı (name) boş ola bilməz.'));
  }
  next();
};
