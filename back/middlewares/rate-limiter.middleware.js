import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dəqiqə
  max: 100, // maksimum 100 sorğu
  message: {
    status: 'fail',
    msg: 'Həddindən artıq sorğu göndərildi. Zəhmət olmasa 15 dəqiqə sonra yenidən cəhd edin.'
  },
  standardHeaders: true, // X-RateLimit-* başlıqlarını qaytarır
  legacyHeaders: false, // X-RateLimit-Limit və X-RateLimit-Remaining başlıqlarını söndürür
});

export default authRateLimiter;
