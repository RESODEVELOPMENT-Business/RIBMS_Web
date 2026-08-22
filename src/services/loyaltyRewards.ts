import { apiClient } from './apiClient';
import type { LoyaltyRewardPolicyPayload, RewardTrigger } from './loyaltyRewardContracts';

export interface LoyaltyRewardRule {
  id: number;
  displayOrder: number;
  rewardType: number;
  productId: number | null;
  productItemId: number | null;
  percentageBasisPoints: number | null;
  amount: number | null;
  quantity: number | null;
  minOrderAmount: number | null;
}

export interface LoyaltyRewardPolicy {
  id: number;
  brandId: number;
  tierId: number;
  policyCode: string;
  trigger: RewardTrigger;
  rewardType: number;
  monthlyCount: number;
  validityDays: number;
  minOrderAmount: number;
  active: boolean;
  rules: LoyaltyRewardRule[];
}

interface ApiResponse<T> {
  status: number;
  message?: string;
  data?: T;
}

export const getLoyaltyRewardPolicies = async (tierId?: number) => {
  const query = tierId ? `?tierId=${encodeURIComponent(String(tierId))}` : '';
  return apiClient<ApiResponse<LoyaltyRewardPolicy[]>>(`/loyalty/reward-policies${query}`);
};

export const upsertLoyaltyRewardPolicy = async (payload: LoyaltyRewardPolicyPayload) => {
  const endpoint = payload.id
    ? `/loyalty/reward-policies/${payload.id}`
    : '/loyalty/reward-policies';
  return apiClient<ApiResponse<{ policyId?: number }>>(endpoint, {
    method: payload.id ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  });
};
