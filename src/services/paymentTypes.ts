import { apiClient } from './apiClient';

export type PaymentType = {
  id?: number;
  paymentTypeId?: number;
  name?: string | null;
  position?: number | null;
  icon?: string | null;
  brandId?: number | null;
  isDisplay?: boolean;
  isComfirm?: boolean;
};

export type PaymentTypePayload = {
  Name: string;
  Position?: number | null;
  Icon?: string | null;
  IsDisplay: boolean;
  IsComfirm: boolean;
};

export const getPaymentTypes = async (page = 1, size = 100) => {
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