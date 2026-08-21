class I18nService {
  constructor() {
    this.dictionary = {
      az: {
        WELCOME: 'TOURSALES Platformasına Xoş Gəlmisiniz',
        BOOKING_CONFIRMED: 'Sayın {name}, {tourTitle} turu üçün {seats} biletiniz təsdiqləndi.',
        PAYMENT_SUCCESS: 'Ödənişiniz ({amount} {currency}) uğurla tamamlandı.',
        NO_SEATS: 'Tura yer qalmayıb.'
      },
      en: {
        WELCOME: 'Welcome to TOURSALES Platform',
        BOOKING_CONFIRMED: 'Dear {name}, your {seats} seat(s) for {tourTitle} have been confirmed.',
        PAYMENT_SUCCESS: 'Your payment ({amount} {currency}) was successful.',
        NO_SEATS: 'No available seats for this tour.'
      },
      ru: {
        WELCOME: 'Добро пожаловать на платформу TOURSALES',
        BOOKING_CONFIRMED: 'Уважаемый(ая) {name}, ваши {seats} билет(а/ов) на тур {tourTitle} подтверждены.',
        PAYMENT_SUCCESS: 'Ваш платеж ({amount} {currency}) успешно завершен.',
        NO_SEATS: 'На этот тур нет свободных мест.'
      },
      tr: {
        WELCOME: 'TOURSALES Platformuna Hoş Geldiniz',
        BOOKING_CONFIRMED: 'Sayın {name}, {tourTitle} turu için {seats} biletiniz onaylandı.',
        PAYMENT_SUCCESS: 'Ödemeniz ({amount} {currency}) başarıyla tamamlandı.',
        NO_SEATS: 'Bu tur için boş yer kalmadı.'
      },
      ar: {
        WELCOME: 'أهلاً بك في منصة TOURSALES',
        BOOKING_CONFIRMED: 'عزيزي {name}، تم تأكيد حجز {seats} مقعدًا لجولة {tourTitle}.',
        PAYMENT_SUCCESS: 'تمت عملية الدفع بنجاح ({amount} {currency}).',
        NO_SEATS: 'لا توجد مقاعد متاحة لهذه الجولة.'
      }
    };
  }

  translate(key, lang = 'az', params = {}) {
    const l = lang.toLowerCase();
    const langDict = this.dictionary[l] || this.dictionary['az'];
    let text = langDict[key] || this.dictionary['az'][key] || key;

    Object.keys(params).forEach(p => {
      text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });

    return text;
  }
}

export const i18nService = new I18nService();
export default i18nService;
