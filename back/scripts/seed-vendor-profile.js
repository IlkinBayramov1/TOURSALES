import prisma from '../config/db.js';

async function seedVendorProfile() {
  console.log('🔄 Şirkət profili məlumatları yenilənir...');

  const companyId = 'C-586288';

  const updatedCompany = await prisma.company.update({
    where: { id: companyId },
    data: {
      name: 'AzTour Travel & Tourism MMC',
      legalName: 'AzTour Turizm və Səyahət MMC',
      voen: '1702948591',
      email: 'aztour@gmail.com',
      phoneNumber: '+994 50 123 45 67',
      address: 'Bakı ş., Səbail r-nu, Nizami küç. 48, AF Business House, 4-cü mərtəbə',
      city: 'Bakı',
      website: 'https://aztour.az',
      description: 'Azərbaycanın və regionun aparıcı daxili və xarici turlarını təşkil edən lisenziyalı rəsmi turizm şirkəti. Ölkədaxili macəra, dağ yürüşləri, istirahət turları və korporativ qrup səyahətləri üzrə 10 ildən artıq təcrübə.',
      workingHours: 'B.e - Şənbə: 09:00 - 19:00',
      logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300',
      coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
      socialLinks: JSON.stringify({
        instagram: 'https://instagram.com/aztour_official',
        facebook: 'https://facebook.com/aztour.az',
        whatsapp: '+994501234567',
        telegram: 'https://t.me/aztour_baku'
      }),
      bankName: 'Azərbaycan Beynəlxalq Bankı (ABB ASC)',
      iban: 'AZ12ABB0000000012345678901',
      bankVoen: '9900001881',
      bankCode: '805624',
      swiftBic: 'IBAZAZ2X',
      payoutAccount: 'AZ12ABB0000000012345678901',
      accountantName: 'Fərid Quliyev (Baş Mühasib)',
      accountantPhone: '+994 55 987 65 43',
      status: 'Active',
      rating: 4.9,
      notificationSettings: JSON.stringify({
        emailBookings: true,
        emailPayouts: true,
        smsAlerts: true,
        marketingTips: false
      })
    }
  });

  console.log('✅ Şirkət profili uğurla yeniləndi:', {
    id: updatedCompany.id,
    name: updatedCompany.name,
    voen: updatedCompany.voen,
    rating: updatedCompany.rating,
    status: updatedCompany.status
  });

  process.exit(0);
}

seedVendorProfile().catch((err) => {
  console.error('❌ Profil toxumu xətası:', err);
  process.exit(1);
});
