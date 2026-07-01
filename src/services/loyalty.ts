import { apiClient } from './apiClient';

export const getLoyaltyStats = async () => {
  return await apiClient('/loyalty/stats');
};

export const getSuperVips = async () => {
  return await apiClient('/admin/super-vip/list');
};

export const checkSuperVip = async (customerId: number) => {
  return await apiClient(`/admin/super-vip/check/${customerId}`);
};

export const addSuperVip = async (customerId: number) => {
  return await apiClient('/admin/super-vip/add', {
    method: 'POST',
    body: JSON.stringify({ customerId }),
  });
};

export const removeSuperVip = async (customerId: number) => {
  return await apiClient(`/admin/super-vip/remove/${customerId}`, {
    method: 'DELETE',
  });
};

export const changeTier = async (customerId: number, tierName: string) => {
  return await apiClient('/admin/super-vip/change-tier', {
    method: 'POST',
    body: JSON.stringify({ customerId, tierName }),
  });
};

