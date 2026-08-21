import ApiError from '../../core/api.error.js';

export const validateTransaction = (req, res, next) => {
  const { amount, type } = req.body;
  if (!amount || !type) {
    return next(ApiError.badRequest('Məbləğ (amount) və növü (type) daxil edilməlidir.'));
  }
  next();
};
