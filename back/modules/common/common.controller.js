import { asyncHandler } from '../../core/utils.js';
import currencyService from './currency.service.js';
import geofenceService from './geofence.service.js';
import i18nService from './i18n.service.js';
import ApiError from '../../core/api.error.js';

class CommonController {
  getCurrencies = asyncHandler(async (req, res) => {
    const result = currencyService.getAllRates();
    return res.json({
      status: 'success',
      msg: 'Məzənnə cədvəli gətirildi',
      data: result
    });
  });

  convertCurrency = asyncHandler(async (req, res) => {
    const { amount, from = 'AZN', to = 'AZN' } = req.query;
    if (!amount) throw ApiError.badRequest('Məbləğ (amount) daxil edilməlidir.');
    const converted = currencyService.convert(parseFloat(amount), from, to);
    return res.json({
      status: 'success',
      msg: 'Valyuta konversiyası uğurla tamamlandı',
      data: {
        originalAmount: parseFloat(amount),
        fromCurrency: from.toUpperCase(),
        toCurrency: to.toUpperCase(),
        convertedAmount: converted
      }
    });
  });

  checkGeofence = asyncHandler(async (req, res) => {
    const { guideLocation, meetingLocation, radiusMeters = 200 } = req.body;
    if (!guideLocation || !meetingLocation) {
      throw ApiError.badRequest('Bələdçi koordinatları və toplanış nöqtəsi tələb olunur.');
    }
    const result = geofenceService.checkGeofenceArrival(guideLocation, meetingLocation, radiusMeters);
    return res.json({
      status: 'success',
      msg: 'Geofence yoxlanışı icra edildi',
      data: result
    });
  });

  translate = asyncHandler(async (req, res) => {
    const { key, lang = 'az', params = {} } = req.body;
    if (!key) throw ApiError.badRequest('Açar (key) daxil edilməlidir.');
    const text = i18nService.translate(key, lang, params);
    return res.json({
      status: 'success',
      data: { key, lang, translation: text }
    });
  });

  uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequest('Şəkil faylı seçilməyib və ya formatı dəstəklənmir.');
    }

    const relativeUrl = `/public/uploads/${req.file.filename}`;
    const host = req.get('host');
    const protocol = req.protocol;
    const fullUrl = `${protocol}://${host}${relativeUrl}`;

    return res.status(201).json({
      status: 'success',
      msg: 'Şəkil uğurla yükləndi',
      data: {
        url: relativeUrl,
        fullUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  });
}

export const commonController = new CommonController();
export default commonController;
