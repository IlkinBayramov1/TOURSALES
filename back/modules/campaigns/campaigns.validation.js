import ApiError from '../../core/api.error.js';

export const validateCampaign = (req, res, next) => {
  const { title, discountPercentage } = req.body;
  if (!title || discountPercentage === undefined) {
    return next(ApiError.badRequest('Kampaniya başlığı (title) və endirim faizi (discountPercentage) vacibdir.'));
  }
  next();
};
