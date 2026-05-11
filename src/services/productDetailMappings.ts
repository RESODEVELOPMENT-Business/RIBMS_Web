import { apiClient } from './apiClient';

export const getProductDetailMappings = async (page = 1, size = 50, brandId?: number, productId?: number, storeId?: number, active?: boolean) => {
  let endpoint = `/product-detail-mappings?page=${page}&size=${size}`;
  if (brandId) {
    endpoint += `&brandId=${brandId}`;
  }
  if (productId) {
    endpoint += `&productId=${productId}`;
  }
  if (storeId) {
    endpoint += `&storeId=${storeId}`;
  }
  if (active !== undefined) {
    endpoint += `&active=${active}`;
  }
  return await apiClient(endpoint);
};

export const getProductDetailMappingById = async (id: string, brandId?: number) => {
  let endpoint = `/product-detail-mappings/${id}`;
  if (brandId) {
    endpoint += `?brandId=${brandId}`;
  }
  return await apiClient(endpoint);
};

export const createProductDetailMapping = async (data: any) => {
  return await apiClient('/product-detail-mappings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateProductDetailMapping = async (id: number, data: any) => {
  return await apiClient(`/product-detail-mappings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteProductDetailMapping = async (id: number) => {
  return await apiClient('/product-detail-mappings/' + id, {
    method: 'DELETE',
  });
};
