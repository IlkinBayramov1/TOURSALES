import React, { createContext, useContext, useEffect, useState } from 'react';
import { CurrencyCode, CurrencyRate } from '@toursales/types';
import { axiosClient } from '../api/axiosClient';
import { API_ENDPOINTS } from '../api/apiEndpoints';
import { formatCurrency as formatHelper } from '../utils/formatters';

interface CurrencyContextType {
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  setCurrency: (currency: CurrencyCode) => void;
  format: (amountInAzn: number) => string;
  formatPrice: (amountInAzn: number, targetCurrency?: CurrencyCode) => string;
}

const DEFAULT_RATES: Record<CurrencyCode, number> = {
  AZN: 1,
  USD: 1.70,
  EUR: 1.85,
  TRY: 0.05,
  RUB: 0.018,
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    return (localStorage.getItem('toursales_currency') as CurrencyCode) || 'AZN';
  });
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(DEFAULT_RATES);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await axiosClient.get(API_ENDPOINTS.COMMON.CURRENCIES);
        if (res.data?.data && Array.isArray(res.data.data)) {
          const map: Record<string, number> = { AZN: 1 };
          res.data.data.forEach((r: CurrencyRate) => {
            map[r.code] = r.rateToAZN;
          });
          setRates((prev) => ({ ...prev, ...map }));
        }
      } catch {
        // use fallback rates
      }
    };
    fetchRates();
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem('toursales_currency', c);
  };

  const formatPrice = (amountInAzn: number, targetCurrency?: CurrencyCode): string => {
    const activeCurr = targetCurrency || currency;
    const rate = rates[activeCurr] || DEFAULT_RATES[activeCurr] || 1;
    return formatHelper(amountInAzn, activeCurr, rate);
  };

  const format = (amountInAzn: number): string => {
    return formatPrice(amountInAzn);
  };

  return (
    <CurrencyContext.Provider value={{ currency, rates, setCurrency, format, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
