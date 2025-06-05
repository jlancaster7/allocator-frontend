export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDecimal = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined) return '-';
  return value.toFixed(decimals);
};

export const formatPercent = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined) return '-';
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatBasisPoints = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return `${Math.round(value * 10000)} bps`;
};