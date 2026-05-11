import { apiClient } from './apiClient';

export interface StoreData {
  Email?: string;
  Password?: string;
  FullName?: string;
  UserName?: string;
  // Basic Information
  Name: string;
  ShortName?: string;
  Address?: string;
  Phone?: string;
  Fax?: string;
  
  // Location
  Lat?: string;
  Lon?: string;
  Province?: string;
  District?: string;
  Ward?: string;
  
  // Status and Configuration
  BrandId?: number; // Will be set by backend from authenticated user
  GroupId?: number | null;
  RoomRentMode?: number | null;
  Type?: number;
  IsAvailable?: boolean;
  Active?: boolean;
  
  // Operating Hours
  OpenTime?: string | null;
  CloseTime?: string | null;
  
  // Features and Capabilities
  HasProducts?: boolean;
  HasNews?: boolean;
  HasImageCollections?: boolean;
  HasMultipleLanguage?: boolean;
  HasWebPages?: boolean;
  HasCustomerFeedbacks?: boolean;
  HasOrder?: boolean;
  HasBlogEditCollections?: boolean;
  
  // Configuration
  DefaultAdminPassword?: string;
  LogoUrl?: string;
  StoreCode?: string;
  PosId?: number | null;
  StoreConfig?: string;
  DefaultDashBoard?: string;
  PaymentTypeApply?: number | null;
  ModeStore?: number | null;
  RunReport?: boolean;
  AttendanceStoreFilter?: number | null;
  StoreFeatureFilter?: string;
}

export const getStores = async (page = 1, size = 50, brandId?: number) => {
  let endpoint = `/stores?page=${page}&size=${size}`;
  if (brandId) {
    endpoint += `&brandId=${brandId}`;
  }
  return await apiClient(endpoint);
};

export const createStore = async (data: StoreData) => {
  return await apiClient('/stores', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getStoreById = async (id: string, brandId?: number) => {
  let endpoint = `/stores/${id}`;
  if (brandId) {
    endpoint += `?brandId=${brandId}`;
  }
  return await apiClient(endpoint);
};

export const updateStore = async (id: number, data: StoreData) => {
  return await apiClient(`/stores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteStore = async (id: number) => {
  return await apiClient('/stores/' + id, {
    method: 'DELETE',
  });
};
