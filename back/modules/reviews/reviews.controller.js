import { asyncHandler } from '../../core/utils.js';
import { reviewsService } from './reviews.service.js';
import ApiError from '../../core/api.error.js';

class ReviewsController {
  create = asyncHandler(async (req, res) => {
    const { tourId } = req.body;
    if (!tourId) throw ApiError.badRequest('Tur ID daxil edilməlidir.');
    const result = await reviewsService.createReview(tourId, req.user.id, req.body);
    return res.status(201).json({
      status: 'success',
      msg: 'Rəyiniz uğurla əlavə edildi.',
      data: result
    });
  });

  getTourReviews = asyncHandler(async (req, res) => {
    const { tourId } = req.params;
    const result = await reviewsService.getTourReviews(tourId);
    return res.json({
      status: 'success',
      msg: 'Turun rəyləri gətirildi.',
      data: result
    });
  });

  getMySatisfactionIndex = asyncHandler(async (req, res) => {
    if (!req.user.companyId) {
      throw ApiError.badRequest('Bu istifadəçi hər hansı şirkətə bağlı deyil.');
    }
    const result = await reviewsService.getVendorSatisfactionIndex(req.user.companyId);
    return res.json({
      status: 'success',
      msg: 'Şirkətinizin müştəri məmnuniyyəti indeksi gətirildi.',
      data: result
    });
  });
}

export const reviewsController = new ReviewsController();
export default reviewsController;
