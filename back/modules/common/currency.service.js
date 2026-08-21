class CurrencyService {
  constructor() {
    // Standard Base Currency: AZN (Azerbaijani Manat)
    // 1 Foreign Unit in AZN
    this.ratesToAZN = {
      AZN: 1.0,
      USD: 1.70,
      EUR: 1.85,
      RUB: 0.019,
      TRY: 0.052,
      AED: 0.46,
      GBP: 2.15
    };
  }

  // Valyuta Məzənnəsinin Qeydə Alınması / Yenilənməsi
  setRate(currency, rateInAZN) {
    this.ratesToAZN[currency.toUpperCase()] = Number(rateInAZN);
  }

  // Real-vaxt Konversiya Hesablaması
  convert(amount, fromCurrency = 'AZN', toCurrency = 'AZN') {
    const amt = Number(amount);
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (from === to) return Math.round(amt * 100) / 100;

    const rateFrom = this.ratesToAZN[from] || 1.0;
    const rateTo = this.ratesToAZN[to] || 1.0;

    // Öncə AZN baza valyutasına çeviririk, sonra hədəf valyutaya vururuq
    const amountInAZN = amt * rateFrom;
    const convertedAmount = amountInAZN / rateTo;

    return Math.round(convertedAmount * 100) / 100;
  }

  // Dəstəklənən Bütün Valyuta Siyahısı və Məzənnələr
  getAllRates() {
    return { baseCurrency: 'AZN', rates: this.ratesToAZN };
  }
}

export const currencyService = new CurrencyService();
export default currencyService;
