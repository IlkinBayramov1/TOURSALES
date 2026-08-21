import ApiError from '../../core/api.error.js';

export const validateBooking = (req, res, next) => {
  const { tourId, passengerName, passengerSurname, contactNumber, contactEmail, seats, paymentStatus, paidAmount } = req.body;

  if (!tourId || !passengerName || !passengerSurname || !contactNumber || !contactEmail || !seats || !paymentStatus || paidAmount === undefined) {
    return next(ApiError.badRequest('Tour ID (tourId), Sərnişin adı və soyadı, Əlaqə nömrəsi və emaili, Yer sayı, Ödəniş statusu və Ödənilən məbləğ vacibdir.'));
  }

  if (parseInt(seats, 10) <= 0) {
    return next(ApiError.badRequest('Yer sayı (seats) 0-dan böyük olmalıdır.'));
  }

  if (paymentStatus !== 'PAID' && paymentStatus !== 'PARTIALLY_PAID' && paymentStatus !== 'PENDING') {
    return next(ApiError.badRequest("Ödəniş statusu yalnız 'PAID', 'PARTIALLY_PAID' və ya 'PENDING' ola bilər."));
  }

  next();
};
