import ApiError from '../../core/api.error.js';

export const validateTour = (req, res, next) => {
  // Normalize frontend vs backend field names
  if (req.body.price === undefined && req.body.basePrice !== undefined) {
    req.body.price = parseFloat(req.body.basePrice);
  }
  if (req.body.maxParticipants === undefined && req.body.capacity !== undefined) {
    req.body.maxParticipants = parseInt(req.body.capacity, 10);
  }
  if (!req.body.meetingPointAddress && req.body.meetingPoint) {
    req.body.meetingPointAddress = req.body.meetingPoint;
  }
  if (!req.body.transportType && req.body.busType) {
    req.body.transportType = req.body.busType;
  }
  if (!req.body.regions && req.body.region) {
    req.body.regions = [req.body.region];
  }
  
  if (req.body.type === 'DOMESTIC') {
    if (!req.body.transportType) {
      req.body.transportType = 'STANDARD_48';
    }
    if (!req.body.meetingPointAddress) {
      req.body.meetingPointAddress = 'Gənclik m/s, Caspian Shopping qarşısı';
    }
    if (!req.body.regions || req.body.regions.length === 0) {
      req.body.regions = [req.body.region || 'Shusha'];
    }
  }

  if (req.body.type === 'FOREIGN') {
    if (!req.body.hotelName) {
      req.body.hotelName = req.body.destinationCountry || 'Standart Otel';
    }
    if (!req.body.meetingPointAddress) {
      req.body.meetingPointAddress = 'Heydər Əliyev Beynəlxalq Hava Limanı (GYD), Terminal 1';
    }
  }

  const { type, title, price, maxParticipants, startDate } = req.body;

  const missing = [];
  if (!type) missing.push('Tur növü (type)');
  if (!title || !String(title).trim()) missing.push('Turun Başlığı (title)');
  if (price === undefined || isNaN(price)) missing.push('Qiymət (price)');
  if (!maxParticipants || isNaN(maxParticipants)) missing.push('Maksimum iştirakçı sayı (maxParticipants)');
  if (!startDate) missing.push('Başlama tarixi (startDate)');

  if (missing.length > 0) {
    return next(ApiError.badRequest(`Aşağıdakı vacib sahələr doldurulmalıdır: ${missing.join(', ')}`));
  }

  if (type !== 'DOMESTIC' && type !== 'FOREIGN') {
    return next(ApiError.badRequest("Tur növü yalnız 'DOMESTIC' və ya 'FOREIGN' ola bilər."));
  }

  next();
};

export const validateTourUpdate = (req, res, next) => {
  if (req.body.price === undefined && req.body.basePrice !== undefined) {
    req.body.price = req.body.basePrice;
  }
  if (req.body.maxParticipants === undefined && req.body.capacity !== undefined) {
    req.body.maxParticipants = req.body.capacity;
  }
  if (req.body.regions === undefined && req.body.region) {
    req.body.regions = [req.body.region];
  }
  if (!req.body.transportType && req.body.busType) {
    req.body.transportType = req.body.busType;
  }
  if (!req.body.meetingPointAddress && req.body.meetingPoint) {
    req.body.meetingPointAddress = req.body.meetingPoint;
  }
  if (req.body.type && req.body.type !== 'DOMESTIC' && req.body.type !== 'FOREIGN') {
    return next(ApiError.badRequest("Tur növü yalnız 'DOMESTIC' və ya 'FOREIGN' ola bilər."));
  }
  next();
};

export default validateTour;
