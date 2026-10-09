/**
 * BIN (Bank Identification Number) Detektoru və Taksit Kalkulyatoru
 * Azərbaycanın aparıcı banklarının kart seriyalarını ilk 6 rəqəm əsasında aşkarlayır.
 */

export const AZ_BANK_BINS = [
  // 1. Kapital Bank (Birkart Taksit & Cashback)
  {
    prefix: ['416973', '409858', '412720', '532686', '535738', '516741', '528204', '420827'],
    bankCode: 'KAPITAL',
    bankName: 'Kapital Bank',
    cardName: 'Birkart Taksit',
    cardBrand: 'VISA',
    isInstallment: true,
    supportedMonths: [2, 3, 6, 12, 18],
    themeColor: '#E31E24',
    badgeText: 'Birkart 0% Taksit + Keşbek',
    logo: 'birkart'
  },
  // 2. ABB - Azərbaycan Beynəlxalq Bankı (Tamkart)
  {
    prefix: ['402860', '403818', '516740', '523580', '539922', '416974', '542617', '431417'],
    bankCode: 'ABB',
    bankName: 'ABB (Beynəlxalq Bank)',
    cardName: 'Tamkart Taksit',
    cardBrand: 'MASTERCARD',
    isInstallment: true,
    supportedMonths: [2, 3, 6, 12, 18],
    themeColor: '#003B70',
    badgeText: 'Tamkart 0% Faizsiz Taksit',
    logo: 'tamkart'
  },
  // 3. Bank of Baku (Bolkart)
  {
    prefix: ['418342', '535733', '409859', '510118', '527581'],
    bankCode: 'BANK_OF_BAKU',
    bankName: 'Bank of Baku',
    cardName: 'Bolkart Taksit',
    cardBrand: 'MASTERCARD',
    isInstallment: true,
    supportedMonths: [3, 6, 12],
    themeColor: '#F5A623',
    badgeText: 'Bolkart Taksit',
    logo: 'bolkart'
  },
  // 4. Unibank (Albalı Plus & Ucard)
  {
    prefix: ['409802', '510117', '521360', '545617', '486718'],
    bankCode: 'UNIBANK',
    bankName: 'Unibank',
    cardName: 'Albalı Plus / Ucard',
    cardBrand: 'VISA',
    isInstallment: true,
    supportedMonths: [3, 6, 12],
    themeColor: '#A30046',
    badgeText: 'Albalı / Ucard Taksit',
    logo: 'albali'
  },
  // 5. Rabitəbank (Kartmane)
  {
    prefix: ['416977', '516742', '535739'],
    bankCode: 'RABITABANK',
    bankName: 'Rabitəbank',
    cardName: 'Kartmane Kredit',
    cardBrand: 'VISA',
    isInstallment: true,
    supportedMonths: [3, 6, 12],
    themeColor: '#00965E',
    badgeText: 'Kartmane Taksit',
    logo: 'kartmane'
  },
  // 6. Paşa Bank
  {
    prefix: ['428236', '548325', '412721'],
    bankCode: 'PASHA_BANK',
    bankName: 'PAŞA Bank',
    cardName: 'PAŞA Bank Kartı',
    cardBrand: 'VISA',
    isInstallment: false,
    supportedMonths: [1],
    themeColor: '#0B2545',
    badgeText: 'PAŞA Bank Miles / Debet',
    logo: 'pashabank'
  }
];

/**
 * Kartın ilk 6 rəqəminə (və ya tam nömrəyə) görə bank və taksit imkanlarını aşkarlayır
 * @param {string} cardNumberOrBin 
 * @returns {object} Detektor nəticəsi
 */
export function detectCardBin(cardNumberOrBin) {
  if (!cardNumberOrBin) {
    return getDefaultCardInfo();
  }

  // Yalnız rəqəmləri saxla
  const cleanDigits = String(cardNumberOrBin).replace(/\D/g, '');
  const bin = cleanDigits.substring(0, 6);

  if (bin.length < 4) {
    return getDefaultCardInfo();
  }

  // 1. Yerli taksit kartı bazasında axtarış
  for (const item of AZ_BANK_BINS) {
    const match = item.prefix.some(p => bin.startsWith(p) || p.startsWith(bin));
    if (match) {
      return {
        bin,
        bankCode: item.bankCode,
        bankName: item.bankName,
        cardName: item.cardName,
        cardBrand: determineBrand(cleanDigits) || item.cardBrand,
        cardType: item.isInstallment ? 'INSTALLMENT' : 'DEBIT',
        isInstallment: item.isInstallment,
        supportedMonths: item.supportedMonths,
        themeColor: item.themeColor,
        badgeText: item.badgeText,
        logo: item.logo,
        isLocalCard: true
      };
    }
  }

  // 2. Taksit bazasında tapılmadıqda brendi və standart debet kartı xüsusiyyətlərini təyin et
  const brand = determineBrand(cleanDigits);
  return {
    bin,
    bankCode: 'OTHER',
    bankName: 'Yerli / Xarici Bank Kartı',
    cardName: brand ? `${brand} Standart Kart` : 'Bank Kartı',
    cardBrand: brand || 'VISA',
    cardType: 'DEBIT',
    isInstallment: false,
    supportedMonths: [1],
    themeColor: '#334155',
    badgeText: 'Birdəfəlik Tam Ödəniş',
    logo: 'standard',
    isLocalCard: false
  };
}

/**
 * Kartın ilk rəqəminə görə ödəniş şəbəkəsini (Visa, MasterCard və s.) təyin edir
 */
export function determineBrand(cleanDigits) {
  if (!cleanDigits) return 'VISA';
  if (cleanDigits.startsWith('4')) return 'VISA';
  if (/^5[1-5]/.test(cleanDigits) || /^2[2-7]/.test(cleanDigits)) return 'MASTERCARD';
  if (/^3[47]/.test(cleanDigits)) return 'AMEX';
  if (/^220[0-4]/.test(cleanDigits)) return 'MIR';
  return 'VISA';
}

/**
 * Taksit üzrə aylıq ödəniş cədvəlini hesablayır
 * @param {number} totalAmount Ümumi məbləğ
 * @param {number[]} supportedMonths Dəstəklənən taksit ayları
 * @param {string} currency Valyuta
 */
export function calculateInstallmentSchedule(totalAmount, supportedMonths = [1, 2, 3, 6, 12, 18], currency = 'AZN') {
  const numericAmount = Math.max(0, Number(totalAmount) || 0);

  return supportedMonths.map(months => {
    const monthlyPayment = months > 0 ? (numericAmount / months) : numericAmount;
    return {
      months,
      label: months === 1 ? 'Birdəfəlik tam ödəniş' : `${months} ay faizsiz`,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: numericAmount,
      formattedMonthly: `${(Math.round(monthlyPayment * 100) / 100).toFixed(2)} ${currency}/ay`,
      isZeroInterest: true
    };
  });
}

function getDefaultCardInfo() {
  return {
    bin: '',
    bankCode: 'OTHER',
    bankName: 'Bank Kartı',
    cardName: 'Debet və ya Taksit Kartı',
    cardBrand: 'VISA',
    cardType: 'DEBIT',
    isInstallment: false,
    supportedMonths: [1],
    themeColor: '#475569',
    badgeText: 'Kart daxil edin',
    logo: 'generic',
    isLocalCard: false
  };
}

export default {
  AZ_BANK_BINS,
  detectCardBin,
  determineBrand,
  calculateInstallmentSchedule
};
