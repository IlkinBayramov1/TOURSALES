import ApiError from '../../core/api.error.js';

export const validateCompany = (req, res, next) => {
  const { name, email, phone, phoneNumber, iban, bankIban, payoutAccount, voen, bankVoen, swiftBic, website } = req.body;

  // 1. Şirkət adı
  if (name !== undefined) {
    const trimmedName = String(name).trim();
    if (!trimmedName) {
      return next(ApiError.badRequest('Şirkət adı (name) boş ola bilməz.'));
    }
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return next(ApiError.badRequest('Şirkət adı 2 ilə 100 simvol arasında olmalıdır.'));
    }
  }

  // 2. E-poçt formatı
  if (email !== undefined && email !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return next(ApiError.badRequest('Düzgün e-poçt ünvanı daxil edin.'));
    }
  }

  // 3. Əlaqə telefonu formatı
  const contactPhone = phone !== undefined ? phone : phoneNumber;
  if (contactPhone !== undefined && contactPhone !== '') {
    const cleanPhone = String(contactPhone).replace(/[\s\-\(\)]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
      return next(ApiError.badRequest('Düzgün əlaqə telefon nömrəsi daxil edin (Məsələn: +994501234567).'));
    }
  }

  // 4. Azərbaycan Bank IBAN formatı (AZ + 2 rəqəm + 4 simvol bank kodu + 20 rəqəm = 28 simvol)
  const rawIban = iban !== undefined ? iban : bankIban;
  if (rawIban !== undefined && rawIban !== '') {
    const cleanIban = String(rawIban).replace(/\s+/g, '').toUpperCase();
    if (!cleanIban.startsWith('AZ') || cleanIban.length !== 28 || !/^[A-Z0-9]+$/.test(cleanIban)) {
      return next(
        ApiError.badRequest(
          'Düzgün Azərbaycan bank IBAN nömrəsi daxil edin. IBAN "AZ" ilə başlamalı və 28 simvoldan ibarət olmalıdır (Məs: AZ44AIIB38019440123456789012).'
        )
      );
    }
  }

  // 5. Çıxarış hesabı (Payout IBAN)
  if (payoutAccount !== undefined && payoutAccount !== '') {
    const cleanPayout = String(payoutAccount).replace(/\s+/g, '').toUpperCase();
    if (!cleanPayout.startsWith('AZ') || cleanPayout.length !== 28 || !/^[A-Z0-9]+$/.test(cleanPayout)) {
      return next(
        ApiError.badRequest(
          'Düzgün çıxarış IBAN hesabı daxil edin. IBAN "AZ" ilə başlamalı və 28 simvoldan ibarət olmalıdır.'
        )
      );
    }
  }

  // 6. VÖEN formatı (10 rəqəmli)
  if (voen !== undefined && voen !== '') {
    const cleanVoen = String(voen).trim();
    if (!/^\d{10}$/.test(cleanVoen)) {
      return next(ApiError.badRequest('VÖEN 10 rəqəmdən ibarət olmalıdır.'));
    }
  }

  // 7. Bank VÖEN formatı
  if (bankVoen !== undefined && bankVoen !== '') {
    const cleanBankVoen = String(bankVoen).trim();
    if (!/^\d{10}$/.test(cleanBankVoen)) {
      return next(ApiError.badRequest('Bank VÖEN-i 10 rəqəmdən ibarət olmalıdır.'));
    }
  }

  // 8. SWIFT / BIC formatı
  if (swiftBic !== undefined && swiftBic !== '') {
    const cleanSwift = String(swiftBic).trim().toUpperCase();
    if (!/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(cleanSwift)) {
      return next(ApiError.badRequest('Düzgün SWIFT/BIC kodu daxil edin (8 və ya 11 simvol, məs: AIIBAZ2X).'));
    }
  }

  // 9. Vebsayt URL formatı
  if (website !== undefined && website !== '') {
    const trimmedWeb = String(website).trim();
    if (!/^https?:\/\/.+/i.test(trimmedWeb)) {
      return next(ApiError.badRequest('Vebsayt ünvanı http:// və ya https:// ilə başlamalıdır.'));
    }
  }

  next();
};

export default validateCompany;
