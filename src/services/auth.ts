import { api } from './apiClient';

export const loginAPI = async (data: any) => {
  return await api.post('/auth/login', data);
};

export const refreshTokenAPI = async () => {
  const Cookies = await import('js-cookie');
  const refreshToken = Cookies.default.get("refreshToken");
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  
  return await api.post('/auth/refresh-token', { refreshToken }, { skipAuth: true } as any);
};
