import ApiError from '../../core/api.error.js';

export const validateTour = (req, res, next) => {
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

    // Qabaqcadan təyin olunmuş Qarabağ yoxlanışı (Qarabağ rayonları seçilə bilməz drop-down-da)
    const karabakhRegions = ['Şuşa', 'Ağdam', 'Xankəndi', 'Xocalı', 'Xocavənd', 'Füzuli', 'Cəbrayıl', 'Zəngilan', 'Qubadlı', 'Laçın', 'Kəlbəcər'];
    const hasKarabakh = regions.some(r => karabakhRegions.includes(r));
    if (hasKarabakh) {
      return next(ApiError.badRequest('Bu siyahıdan Qarabağ rayonları seçilə bilməz (Daxili tur məhdudiyyəti).'));
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
