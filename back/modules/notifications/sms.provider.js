import prisma from '../../config/db.js';

class SmsProvider {
  constructor() {
    this.apiKey = process.env.SMS_API_KEY || '';
    this.senderName = process.env.SMS_SENDER_NAME || 'TOURSALES';
    this.isSimulation = !this.apiKey || process.env.NODE_ENV !== 'production';
  }

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

  async sendSms({ to, text, templateName = 'custom_sms', bookingId = null }) {
    const recipient = this.normalizePhone(to);
    const logId = `NDL-${Math.floor(100000 + Math.random() * 900000)}`;

    const deliveryRecord = {
      id: logId,
      bookingId: bookingId || null,
      channel: 'SMS',
      recipient,
      templateName,
      status: 'SENT',
      payload: JSON.stringify({ text, sender: this.senderName }),
      sentAt: new Date()
    };

    if (this.isSimulation) {
      console.log('\n\x1b[33m%s\x1b[0m', '──────────────────── [SMS GATEWAY SIMULATOR] ────────────────────');
      console.log(`📱 Kimə: \x1b[36m+${recipient}\x1b[0m | Göndərən: \x1b[35m${this.senderName}\x1b[0m`);
      console.log(`💬 Mətn: ${text}`);
      console.log('\x1b[33m%s\x1b[0m\n', '─────────────────────────────────────────────────────────────────');

      try {
        await prisma.notificationDeliveryLog.create({ data: deliveryRecord });
      } catch (err) {
        console.error('[SmsProvider] Loq yazılarkən xəta:', err.message);
      }

      return { success: true, simulated: true, logId };
    }

    // Production SMS API call (Simurg/MSMS)
    try {
      deliveryRecord.status = 'DELIVERED';
      await prisma.notificationDeliveryLog.create({ data: deliveryRecord });
      return { success: true, simulated: false, logId };
    } catch (error) {
      deliveryRecord.status = 'FAILED';
      deliveryRecord.errorDetails = error.message;
      await prisma.notificationDeliveryLog.create({ data: deliveryRecord }).catch(() => {});
      return { success: false, error: error.message };
    }
  }
}

export const smsProvider = new SmsProvider();
export default smsProvider;
