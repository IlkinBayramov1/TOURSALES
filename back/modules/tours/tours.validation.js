import ApiError from '../../core/api.error.js';

export const validateTour = (req, res, next) => {
  // Normalize frontend vs backend field names
  if (req.body.price === undefined && req.body.basePrice !== undefined) {
    req.body.price = req.body.basePrice;
  }
  if (req.body.maxParticipants === undefined && req.body.capacity !== undefined) {
    req.body.maxParticipants = req.body.capacity;
  }
  
  if (req.body.type === 'DOMESTIC') {
    if (!req.body.regions || !Array.isArray(req.body.regions) || req.body.regions.length === 0) {
      if (req.body.region) {
        req.body.regions = [req.body.region];
      }
    }
    if (!req.body.transportType && req.body.busType) {
      req.body.transportType = req.body.busType;
    }
    if (!req.body.meetingPointAddress && req.body.meetingPoint) {
      req.body.meetingPointAddress = req.body.meetingPoint;
    }
  }

  if (req.body.type === 'FOREIGN') {
    if (!req.body.hotelName) {
      req.body.hotelName = req.body.destinationCountry || 'Standart Otel';
    }
  }

  const { type, title, price, maxParticipants, startDate } = req.body;

  if (!type || !title || price === undefined || !maxParticipants || !startDate) {
    return next(ApiError.badRequest('Tur növü (type), başlıq (title), qiymət (price), maksimum iştirakçı sayı (maxParticipants) və başlama tarixi (startDate) vacibdir.'));
  }

  if (type !== 'DOMESTIC' && type !== 'FOREIGN') {
    return next(ApiError.badRequest("Tur növü yalnız 'DOMESTIC' və ya 'FOREIGN' ola bilər."));
  }

  if (type === 'DOMESTIC') {
    const { regions, transportType, meetingPointAddress } = req.body;
    if (!regions || !Array.isArray(regions) || regions.length === 0) {
      return next(ApiError.badRequest('Daxili tur üçün ən azı bir region (rayon) seçilməlidir.'));
    }
    if (!transportType) {
      return next(ApiError.badRequest('Daxili tur üçün nəqliyyat növü (transportType) vacibdir.'));
    }
    if (!meetingPointAddress) {
      return next(ApiError.badRequest('Daxili tur üçün toplanış yeri (meetingPointAddress) vacibdir.'));
    }
  }

  if (type === 'FOREIGN') {
    const { hotelName } = req.body;
    if (!hotelName) {
      return next(ApiError.badRequest('Xarici tur üçün otel adı (hotelName) vacibdir.'));
    }
  }

  next();
};

export default validateTour;
