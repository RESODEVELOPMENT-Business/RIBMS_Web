import { apiClient } from './apiClient';

export const CONDITION_TYPE_LABELS: Record<number, string> = {
  0: 'Product Specific',
  1: 'Category',
  2: 'Min Bill Amount',
  3: 'Min Quantity',
};

export interface CreateConditionData {
  conditionType: number;
  value: string;
}

export interface CreateStampProgramData {
  brandId: number;
  displayName: string;
  description?: string;
  fromDate?: string;
  toDate?: string;
  isActive?: boolean;
  conditionLogic: string;
  storeIds: number[];
  conditions: CreateConditionData[];
}

export interface SharedStampRewardUpsertData {
  rewardType: number;
  productId?: number | null;
  productItemId?: number | null;
  quantity: number;
}

export interface SharedStampReward extends SharedStampRewardUpsertData {
  id: number;
  rewardDescription?: string;
}

export interface StampRewardOption {
  id?: number;
  stampRequired: number;
  rewardType: number | string;
  rewardValue?: string;
  rewardDescription?: string;
  brandLoyaltyTierId?: number | null;
  productId?: number | null;
  productItemId?: number | null;
  quantity?: number;
  active?: boolean;
  sortOrder?: number;
  productName?: string | null;
  productItemName?: string | null;
}

export interface StampProgram {
  id: number;
  brandId: number;
  displayName: string;
  description?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  isActive: boolean;
  conditionLogic: string;
  storeNames?: string[];
  rewardTiers: StampRewardOption[];
}

export const getStampPrograms = async (page = 1, size = 20, isActive?: boolean) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (isActive !== undefined) params.set('isActive', String(isActive));
  return await apiClient(`/admin/stamp-programs?${params.toString()}`);
};

export const getStampProgramById = async (id: number) => {
  return await apiClient(`/admin/stamp-programs/${id}`);
};

export const getEffectiveStampProgram = async () => {
  return await apiClient('/admin/stamp-programs/effective');
};

export const getSharedStampReward = async (id: number) => {
  return await apiClient(`/admin/stamp-programs/${id}/shared-reward`);
};

export const updateSharedStampReward = async (id: number, data: SharedStampRewardUpsertData) => {
  return await apiClient(`/admin/stamp-programs/${id}/shared-reward`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const createStampProgram = async (data: CreateStampProgramData) => {
  return await apiClient('/admin/stamp-programs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateStampProgram = async (id: number, data: Partial<CreateStampProgramData>) => {
  return await apiClient(`/admin/stamp-programs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteStampProgram = async (id: number) => {
  return await apiClient(`/admin/stamp-programs/${id}`, {
    method: 'DELETE',
  });
};
