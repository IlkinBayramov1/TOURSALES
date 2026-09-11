import { CurrencyCode } from '@toursales/types';

export const formatCurrency = (
  amount: number,
  currency: CurrencyCode = 'AZN',
  rateToAzn: number = 1
): string => {
  const converted = currency === 'AZN' ? amount : amount / rateToAzn;
  const formatted = new Intl.NumberFormat('az-AZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);

  switch (currency) {
    case 'AZN':
      return `${formatted} ₼`;
    case 'USD':
      return `$${formatted}`;
    case 'EUR':
      return `€${formatted}`;
    default:
      return `${formatted} ${currency}`;
  }
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('az-AZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('az-AZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
