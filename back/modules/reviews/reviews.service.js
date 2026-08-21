import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import ApiError from '../../core/api.error.js';

class ReviewsService {
  async createReview(tourId, userId, data) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('İstifadəçi tapılmadı.');

    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) throw ApiError.notFound('Tur tapılmadı.');

    // 1. Müştəri bu turun biletini alıbmı yoxlanışı
    const confirmedBooking = await prisma.booking.findFirst({
      where: {
        tourId,
        contactEmail: user.email,
        status: 'CONFIRMED'
      }
    });

    if (!confirmedBooking) {
      throw ApiError.badRequest('Yalnız turun biletini satın almış real müştərilər rəy yaza bilərlər.');
    }

    // 2. Turun vaxtı bitibmi yoxlanışı (real təcrübədən sonra rəy)
    if (new Date(tour.startDate) > new Date()) {
      throw ApiError.badRequest('Tur hələ başlamayıb. Yalnız tur başladıqdan sonra rəy yaza bilərsiniz.');
    }

    // 3. Təkrarlanmayan rəy yoxlanışı
    const alreadyReviewed = await prisma.review.findFirst({
      where: { tourId, userId }
    });

    if (alreadyReviewed) {
      throw ApiError.badRequest('Siz artıq bu tura rəy yazmısınız.');
    }

    const rating = parseInt(data.rating, 10);
    if (rating < 1 || rating > 5) {
      throw ApiError.badRequest('Reytinq 1 ilə 5 ulduz arasında olmalıdır.');
    }

    const id = await generateUniqueId('R', 'review');
    return prisma.review.create({
      data: {
        id,
        tourId,
        userId,
        rating,
        comment: data.comment
      },
      include: {
        user: { select: { name: true } }
      }
    });
  }

  async getTourReviews(tourId) {
    const reviews = await prisma.review.findMany({
      where: { tourId },
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      reviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: reviews.length
    };
  }

  async getVendorSatisfactionIndex(companyId) {
    const tours = await prisma.tour.findMany({
      where: { companyId },
      select: { id: true }
    });

    const tourIds = tours.map(t => t.id);

    const reviews = await prisma.review.findMany({
      where: { tourId: { in: tourIds } }
    });

    const satisfactionScore = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 20 // 5 ballıq reytinqi 100 bala çeviririk
      : 0;

    return {
      satisfactionScore: `${parseFloat(satisfactionScore.toFixed(1))}%`,
      totalReviewsReceived: reviews.length
    };
  }
}

export const reviewsService = new ReviewsService();
export default reviewsService;
