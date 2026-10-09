import env from '../../config/env.js';
import prisma from '../../config/db.js';

class WhatsAppProvider {
  constructor() {
    this.apiToken = process.env.WHATSAPP_API_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.apiUrl = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
    this.isSimulation = !this.apiToken || process.env.NODE_ENV !== 'production';
  }

  /**
   * Telefon nömrəsini beynəlxalq formata standartlaşdırır (məs: 994501234567)
   */
  normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '994' + cleaned.substring(1);
    } else if (cleaned.length === 9 && !cleaned.startsWith('994')) {
      cleaned = '994' + cleaned;
    }
    return cleaned;
  }

  /**
   * Əsas göndərmə və loqlaşdırma metodu
   */
  async sendMessage({ to, text, templateName = 'custom', bookingId = null, metadata = {} }) {
    const recipient = this.normalizePhone(to);
    const logId = `NDL-${Math.floor(100000 + Math.random() * 900000)}`;

    const isTourBooking = bookingId && (bookingId.startsWith('TR-') || bookingId.startsWith('B-'));
    const deliveryRecord = {
      id: logId,
      bookingId: isTourBooking ? bookingId : null,
      channel: 'WHATSAPP',
      recipient,
      templateName,
      status: 'SENT',
      payload: JSON.stringify({ text, metadata: { ...metadata, bookingId } }),
      sentAt: new Date()
    };

    if (this.isSimulation) {
      console.log('\n\x1b[32m%s\x1b[0m', '════════════════════ [WHATSAPP BUSINESS SIMULATOR] ════════════════════');
      console.log(`📱 Kimə (Recipient): \x1b[36m+${recipient}\x1b[0m`);
      console.log(`📋 Şablon: \x1b[33m${templateName}\x1b[0m | Bilet: \x1b[90m${bookingId || 'Yoxdur'}\x1b[0m`);
      console.log(`💬 Mesaj Mətni:\n${text}`);
      console.log('\x1b[32m%s\x1b[0m\n', '═══════════════════════════════════════════════════════════════════════');

      try {
        await prisma.notificationDeliveryLog.create({ data: deliveryRecord });
      } catch (err) {
        console.error('[WhatsAppProvider] Loq yazılarkən xəta:', err.message);
      }

      return { success: true, simulated: true, logId, recipient };
    }

    // Production Meta WhatsApp Cloud API Call
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'text',
          text: { preview_url: true, body: text }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      deliveryRecord.status = 'DELIVERED';
      await prisma.notificationDeliveryLog.create({ data: deliveryRecord });

      return { success: true, simulated: false, data, logId };
    } catch (error) {
      const errMsg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      console.error('[WhatsAppProvider ERROR]', errMsg);

      deliveryRecord.status = 'FAILED';
      deliveryRecord.errorDetails = errMsg;
      await prisma.notificationDeliveryLog.create({ data: deliveryRecord }).catch(() => {});

      return { success: false, error: errMsg };
    }
  }

  /**
   * 1. Bilet və Sifariş Təsdiqi
   */
  async sendBookingConfirmation(booking, tour, { voucherBaseUrl = 'http://localhost:5173' } = {}) {
    const passengerName = `${booking.passengerName || ''} ${booking.passengerSurname || ''}`.trim() || 'Səyahətçi';
    const tourTitle = tour?.title || 'Azərbaycan Turu';
    const startDate = tour?.startDate ? new Date(tour.startDate).toLocaleDateString('az-AZ') : 'Təyin olunub';
    const meetingPoint = tour?.meetingPointAddress || 'Gənclik m/s';
    const seatNumber = booking.busSeatNumber || 'Avtomatik təyin ediləcək';
    const voucherUrl = `${voucherBaseUrl}/voucher/${booking.id}`;
    const mapsLink = tour?.meetingPointLat && tour?.meetingPointLng 
      ? `https://www.google.com/maps?q=${tour.meetingPointLat},${tour.meetingPointLng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingPoint)}`;

    const text = 
`Hörmətli ${passengerName}, *${tourTitle}* səyahətiniz üçün biletiniz uğurla təsdiqləndi! 🎉

📋 *Bilet Nömrəsi:* ${booking.id}
💺 *Oturacaq Nömrəniz:* ${seatNumber}
📅 *Çıxış Tarixi:* ${startDate}
📍 *Toplanış Yeri:* ${meetingPoint}
🗺️ *Xəritə Naviqasiya:* ${mapsLink}

📲 *Elektron QR Vauçeriniz:*
${voucherUrl}

_Avtobusa minərkən smartfonunuzdakı QR kodu bələdçiyə təqdim etməyiniz kifayətdir._
Xoş səyahətlər arzulayırıq! — *TOURSALES*`;

    return this.sendMessage({
      to: booking.contactNumber,
      text,
      templateName: 'booking_confirmation',
      bookingId: booking.id,
      metadata: { tourId: tour?.id, seatNumber, voucherUrl }
    });
  }

  /**
   * 2. Çıxışa 24 Saat Qalmış Xatırlatma
   */
  async sendDepartureReminder24h(booking, tour) {
    const passengerName = `${booking.passengerName || ''} ${booking.passengerSurname || ''}`.trim() || 'Səyahətçi';
    const tourTitle = tour?.title || 'Tur';
    const meetingPoint = tour?.meetingPointAddress || 'Gənclik m/s';
    const departureTime = tour?.startDate ? new Date(tour.startDate).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : '07:00';
    const guideName = tour?.guide?.name || 'Təyin olunub';
    const guidePhone = tour?.guide?.phoneNumber || '+994 (77) 599 00 95';

    const text = 
`Sabahkı səyahətiniz üçün xatırlatma! ⏰

Hörmətli ${passengerName}, sabah *${tourTitle}* turu üçün yola düşürük.
📍 *Toplanış Yeri:* ${meetingPoint}
⏰ *Toplanış Vaxtı:* ${departureTime}
💺 *Oturacağınız:* ${booking.busSeatNumber || 'Biletə baxın'}
👨‍💼 *Bələdçiniz:* ${guideName} (${guidePhone})

⚠️ _Zəhmət olmasa şəxsiyyət vəsiqənizi və ya pasportunuzu götürməyi, toplanış vaxtından 15 dəqiqə əvvəl gəlməyi unutmayın._`;

    return this.sendMessage({
      to: booking.contactNumber,
      text,
      templateName: 'departure_reminder_24h',
      bookingId: booking.id,
      metadata: { tourId: tour?.id, guideName }
    });
  }

  /**
   * 3. Çıxışa 2 Saat Qalmış Avtobus Məlumatı
   */
  async sendDepartureReminder2h(booking, tour) {
    const passengerName = `${booking.passengerName || ''} ${booking.passengerSurname || ''}`.trim() || 'Səyahətçi';
    const tourTitle = tour?.title || 'Tur';
    const plate = tour?.busPlateNumber || '99-XX-000';
    const driver = tour?.driverName ? `${tour.driverName} (${tour.driverPhone || ''})` : 'Təyin olunub';
    const guideName = tour?.guide?.name || 'Bələdçimiz';

    const text = 
`Avtobusumuz toplanış yerinə yaxınlaşır! 🚌

Hörmətli ${passengerName}, *${tourTitle}* üçün avtobus toplanış nöqtəsindədir:
🔢 *Dövlət Qeydiyyat Nişanı:* ${plate}
👤 *Sürücü:* ${driver}
🚩 *Bələdçiniz:* ${guideName} sizi toplanış yerində qarşılayır.

Gecikməməyiniz xahiş olunur! Xoş yol! 🌄`;

    return this.sendMessage({
      to: booking.contactNumber,
      text,
      templateName: 'departure_reminder_2h',
      bookingId: booking.id,
      metadata: { tourId: tour?.id, busPlateNumber: plate }
    });
  }

  /**
   * 4. Turdan Sonra Rəy və 50 Bonus Xalı
   */
  async sendReviewRequest(booking, tour, { reviewBaseUrl = 'http://localhost:5173' } = {}) {
    const passengerName = `${booking.passengerName || ''} ${booking.passengerSurname || ''}`.trim() || 'Səyahətçi';
    const tourTitle = tour?.title || 'Tur';
    const reviewUrl = `${reviewBaseUrl}/tours/${tour?.id || ''}?review=open`;

    const text = 
`*${tourTitle}* səyahətiniz necə keçdi? 😊

Hörmətli ${passengerName}, ümid edirik ki, unudulmaz anlar yaşadınız!
Təəssüratlarınızı və bələdçimizi 1 dəqiqəyə qiymətləndirib, hesabınıza *50 Loyallıq Xalı* qazanın:
🌟 ${reviewUrl}

Növbəti səyahətlərdə görüşənədək! — *TOURSALES*`;

    return this.sendMessage({
      to: booking.contactNumber,
      text,
      templateName: 'trip_feedback_request',
      bookingId: booking.id,
      metadata: { tourId: tour?.id, reviewUrl }
    });
  }

  async sendWhatsAppMessage({ to, text, bodyText, templateName = 'custom', bookingId = null, metadata = {} }) {
    return this.sendMessage({ to, text: text || bodyText, templateName, bookingId, metadata });
  }

  async sendBookingConfirmationTemplate({ booking, tour, voucherUrl }) {
    return this.sendBookingConfirmation(booking, tour);
  }
}

export const whatsappProvider = new WhatsAppProvider();
export default whatsappProvider;
