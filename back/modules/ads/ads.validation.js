import ApiError from '../../core/api.error.js';

export const validateAdPurchase = (req, res, next) => {
  const { tourId, packageId } = req.body;
  if (!tourId || !packageId) {
    return next(ApiError.badRequest('Tur ID (tourId) və Reklam Paketi ID (packageId) daxil edilməlidir.'));
  }
  next();
};

export const validateAdPackage = (req, res, next) => {
  const { durationDays, price } = req.body;
  if (!durationDays || price === undefined) {
    return next(ApiError.badRequest('Müddət (durationDays) və Qiymət (price) daxil edilməlidir.'));
  }
  next();
};
