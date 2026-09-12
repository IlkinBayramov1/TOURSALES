import ApiError from '../../core/api.error.js';

export const validateAdPurchase = (req, res, next) => {
  const { tourId, packageId, title } = req.body;
  if (!packageId) {
    return next(ApiError.badRequest('Reklam paketi ID (packageId) mütləq daxil edilməlidir.'));
  }
  if (!tourId && !title) {
    return next(ApiError.badRequest('Reklam üçün ya tur (tourId), ya da xüsusi başlıq (title) seçilməlidir.'));
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
