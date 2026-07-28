import { apiClient } from './apiClient';

export const EPaymentTypeLabels: Record<number, string> = {
  0: 'Cash (Tiền mặt)',
  1: 'Transfer (Chuyển khoản)',
  2: 'Grab',
  3: 'Shopee',
  4: 'Zalo',
  5: 'Member (Thẻ thành viên)',
  6: 'MasterCard',
  7: 'VisaCard',
  8: 'MomoAio',
  9: 'Momo',
  10: 'Moca',
  11: 'VnPay',
  12: 'GrabFood',
  13: 'Baemin',
  14: 'ShopeePay',
  15: 'PayOs',
  16: 'Payoo',
  17: 'SePay',
};

export const PlatformLabels: Record<number, string> = {
  0: 'Cả POS & Mobile',
  1: 'Chỉ POS',
  2: 'Chỉ Mobile',
};

export type PaymentType = {
  id?: number;
  paymentTypeId?: number;
  name?: string | null;
  position?: number | null;
  icon?: string | null;
  brandId?: number | null;
  isDisplay?: boolean;
  isComfirm?: boolean;
  type?: number;
  platform?: number;
};

export type PaymentTypePayload = {
  Name: string;
  Type: number;
  Platform: number;
  Position?: number | null;
  Icon?: string | null;
  IsDisplay: boolean;
  IsComfirm: boolean;
};

export const getPaymentTypes = async (page = 1, size = 100) => {
  return await apiClient(`/payment-types?page=${page}&size=${size}`);
};

export const getPaymentTypesByBrand = async (page = 1, size = 100) => {
  return await apiClient(`/payment-types?page=${page}&size=${size}`);
};

export const getPaymentTypeById = async (id: number | string) => {
  return await apiClient(`/payment-types/${id}`);
};

export const createPaymentType = async (data: PaymentTypePayload) => {
  return await apiClient('/payment-types', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updatePaymentType = async (id: number | string, data: PaymentTypePayload) => {
  return await apiClient(`/payment-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deletePaymentType = async (id: number | string) => {
  return await apiClient(`/payment-types/${id}`, {
    method: 'DELETE',
  });
};