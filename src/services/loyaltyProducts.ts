import { apiClient } from './apiClient';
import {
  parseBrandProductResponse,
  parseProductItemResponse,
} from './loyaltyProductContracts';

export type { LoyaltyProductOption } from './loyaltyProductContracts';

export const getBrandProducts = async (page = 1, size = 500) => {
  const response = await apiClient(`/products?page=${page}&size=${size}&status=true`);
  return parseBrandProductResponse(response);
};

export const getBrandProductItems = async (page = 1, size = 500) => {
  const response = await apiClient(`/product-items?page=${page}&size=${size}&active=true`);
  return parseProductItemResponse(response);
};
