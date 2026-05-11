export const formatCurrency = (value?: number | null) => {
  if (!value) return '-';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};
