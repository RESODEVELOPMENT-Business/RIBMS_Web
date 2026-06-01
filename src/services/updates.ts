import { apiClient } from './apiClient';

export interface AdminUpdateTriggerResponse {
  forceUpdate: boolean;
  version?: string;
  installerFileName?: string;
  triggeredAtUtc?: string;
  triggeredBy?: string;
}

export const triggerAdminUpdate = async () => {
  return await apiClient<{ data?: AdminUpdateTriggerResponse }>(
    '/updates/admin-trigger-update',
    {
      method: 'POST',
    }
  );
};