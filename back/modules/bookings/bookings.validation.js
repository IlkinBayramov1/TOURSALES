import ApiError from '../../core/api.error.js';

export const validateBooking = (req, res, next) => {
  // Avtomatik olaraq sərnişinlər massivindən əsas sifarişçi məlumatlarını çıxarmaq
  if (Array.isArray(req.body.passengers) && req.body.passengers.length > 0) {
    const primary = req.body.passengers[0];
    if (!req.body.passengerName && primary.fullName) {
      const parts = primary.fullName.trim().split(/\s+/);
      req.body.passengerName = parts[0] || 'Müştəri';
      req.body.passengerSurname = parts.slice(1).join(' ') || 'Sərnişin';
    }
    if (!req.body.contactNumber && primary.phone) {
      req.body.contactNumber = primary.phone;
    }
    if (!req.body.seats) {
      req.body.seats = req.body.seatNumbers?.length || req.body.passengers.length;
    }
    if (!req.body.passengerPassport && (primary.passportNumber || primary.finCode || primary.idNumber)) {
      req.body.passengerPassport = primary.passportNumber || primary.finCode || primary.idNumber;
    }
  }

  if (!req.body.contactEmail) {
    req.body.contactEmail = req.user?.email || 'guest@toursales.az';
  }

  if (!req.body.paymentStatus) {
    req.body.paymentStatus = 'PENDING';
  }

  const { tourId, passengerName, passengerSurname, contactNumber, contactEmail, seats, paymentStatus } = req.body;

  if (!tourId || !passengerName || !passengerSurname || !contactNumber || !contactEmail || !seats) {
    return next(ApiError.badRequest('Tour ID (tourId), Sərnişin adı və soyadı, Əlaqə nömrəsi və emaili, Yer sayı vacibdir.'));
  }

  if (parseInt(seats, 10) <= 0) {
    return next(ApiError.badRequest('Yer sayı (seats) 0-dan böyük olmalıdır.'));
  }

  if (paymentStatus !== 'PAID' && paymentStatus !== 'PARTIALLY_PAID' && paymentStatus !== 'PENDING') {
    return next(ApiError.badRequest("Ödəniş statusu yalnız 'PAID', 'PARTIALLY_PAID' və ya 'PENDING' ola bilər."));
  }

  next();
};
