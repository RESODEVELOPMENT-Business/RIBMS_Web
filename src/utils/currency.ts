export const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined || value === 0) return '-';

  // Round to 2 decimal places to eliminate IEEE 754 precision issues
  const safeValue = Math.round((value + Number.EPSILON) * 100) / 100;

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(safeValue);
};
