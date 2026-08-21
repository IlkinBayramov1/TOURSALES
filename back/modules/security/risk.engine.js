class RiskEngine {
  constructor() {
    this.disposableDomains = ['tempmail.com', 'mailinator.com', '10minutemail.com', 'dispostable.com'];
  }

  // Fraud & Risk Skorunun (0-100) Hesablanması
  evaluateBookingRisk(context) {
    const { email, amount, userBookingCount = 0, recentBookingsIn10Min = 0, failedPaymentAttempts = 0 } = context;

    let score = 0;
    const reasons = [];

    // 1. Birfəlik (Disposable) e-poçt domen yoxlanışı
    const domain = email ? email.split('@')[1] : '';
    if (this.disposableDomains.includes(domain)) {
      score += 35;
      reasons.push('Şübhəli/Müvəqqəti email domeni');
    }

    // 2. Velocity Check (Son 10 dəqiqədə çoxlu rezervasiya)
    if (recentBookingsIn10Min >= 3) {
      score += 40;
      reasons.push('Velocity Alert: Son 10 dəqiqədə 3-dən çox sorğu');
    }

    // 3. Yüksək məbləğli ilk sifariş
    if (userBookingCount === 0 && amount >= 1000) {
      score += 20;
      reasons.push('Yeni istifadəçinin yüksək məbləğli tranzaksiyası');
    }

    // 4. Çoxlu uğursuz ödəniş cəhdləri
    if (failedPaymentAttempts >= 3) {
      score += 30;
      reasons.push('Çoxlu uğursuz ödəniş cəhdi');
    }

    const action = score >= 70 ? 'REJECT' : score >= 40 ? 'MANUAL_REVIEW' : 'APPROVE';

    return {
      score: Math.min(100, score),
      action,
      reasons,
      timestamp: new Date()
    };
  }
}

export const riskEngine = new RiskEngine();
export default riskEngine;
