import ApiError from '../../core/api.error.js';

export const validateCampaign = (req, res, next) => {
  const { promoCode, discountValue, startDate, endDate } = req.body;
  if (!promoCode || discountValue === undefined || !startDate || !endDate) {
    return next(ApiError.badRequest('Promokod (promoCode), endirim məbləği/faizi (discountValue), başlama tarixi (startDate) və bitmə tarixi (endDate) vacibdir.'));
  }
  next();
};
