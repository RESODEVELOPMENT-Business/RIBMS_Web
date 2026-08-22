import { apiClient } from './apiClient';

export interface BrandLoyaltyPointReward {
  id: number;
  brandId: number;
  name: string;
  description?: string | null;
  costInPoints: number;
  rewardType: number; // 1 = Percentage, 2 = Amount, 3 = ProductDiscount, 4 = FreeProduct
  discountAmount?: number | null;
  discountRate?: number | null;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  validityDays: number;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface BrandLoyaltyPointRewardPayload {
  brandId?: number;
  name: string;
  description?: string | null;
  costInPoints: number;
  rewardType: number;
  discountAmount?: number | null;
  discountRate?: number | null;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  validityDays: number;
  sortOrder: number;
  active: boolean;
}

export interface ApiResponse<T = unknown> {
  status: number;
  message?: string;
  data?: T;
}

const endpoint = '/admin/brand-loyalty-point-rewards';

export const getPointRewards = async (brandId?: number) => {
  const query = brandId ? `?brandId=${encodeURIComponent(String(brandId))}` : '';
  return apiClient<ApiResponse<BrandLoyaltyPointReward[]>>(`${endpoint}${query}`);
};

export const createPointReward = async (data: BrandLoyaltyPointRewardPayload) => {
  return apiClient<ApiResponse<BrandLoyaltyPointReward>>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updatePointReward = async (
  id: number,
  data: BrandLoyaltyPointRewardPayload,
) => {
  return apiClient<ApiResponse<BrandLoyaltyPointReward>>(`${endpoint}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deletePointReward = async (id: number) => {
  return apiClient<ApiResponse>(`${endpoint}/${id}`, {
    method: 'DELETE',
  });
};
