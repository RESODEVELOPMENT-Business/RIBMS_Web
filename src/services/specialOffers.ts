import { apiClient } from './apiClient';

export const BENEFIT_TYPE_LABELS: Record<number, string> = {
  0: 'Fixed Amount',
  1: 'Percentage',
  2: 'Free Product',
  3: 'Free Upsize',
  4: 'Buy X Get Y',
  5: 'Category Discount',
};

export const REDEMPTION_FLOW_LABELS: Record<number, string> = {
  0: 'Auto Apply',
  1: 'POS Selection',
  2: 'Voucher Code',
};

export interface CreateBenefitItem {
  benefitType: number;
  discountAmount?: number;
  discountRate?: number;
  buyProductCode?: string;
  giftProductCode?: string;
  giftQuantity?: number;
  freeProductCode?: string;
  categoryId?: number;
  minQuantity?: number;
  minOrderAmount?: number;
  sortOrder: number;
}

export interface CreateSpecialOfferData {
  displayName: string;
  description?: string;
  iconName?: string;
  sortOrder: number;
  fromDate?: string;
  toDate?: string;
  applyFromTime?: number;
  applyToTime?: number;
  fromDayOfWeek?: number;
  toDayOfWeek?: number;
  isRecurring: boolean;
  maxUsagePerCustomer?: number;
  maxUsageGlobal?: number;
  maxUsagePerDay?: number;
  maxUsagePerStore?: number;
  redemptionFlow: number;
  isStackable: boolean;
  isSelfSelect: boolean;
  customerIds: number[];
  storeIds: number[];
  benefitItems: CreateBenefitItem[];
}

export const getSpecialOffers = async (
  page = 1,
  size = 20,
  isActive?: boolean,
  storeId?: number
) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (isActive !== undefined) params.set('isActive', String(isActive));
  if (storeId) params.set('storeId', String(storeId));
  return await apiClient(`/admin/special-offers?${params.toString()}`);
};

export const getSpecialOfferById = async (id: number) => {
  return await apiClient(`/admin/special-offers/${id}`);
};

export const createSpecialOffer = async (data: CreateSpecialOfferData) => {
  return await apiClient('/admin/special-offers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateSpecialOffer = async (id: number, data: Partial<CreateSpecialOfferData>) => {
  return await apiClient(`/admin/special-offers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteSpecialOffer = async (id: number) => {
  return await apiClient(`/admin/special-offers/${id}`, {
    method: 'DELETE',
  });
};

export const deleteBenefitItem = async (itemId: number) => {
  return await apiClient(`/admin/special-offers/benefit-items/${itemId}`, {
    method: 'DELETE',
  });
};
