import { apiClient } from './apiClient';

export const getProductCategories = async (page = 1, size = 50, brandId?: number) => {
  let endpoint = `/product-categories?page=${page}&size=${size}`;
  if (brandId) {
    endpoint += `&brandId=${brandId}`;
  }
  return await apiClient(endpoint);
};

export const getProductCategoryById = async (id: string, brandId?: number) => {
  let endpoint = `/product-categories/${id}`;
  if (brandId) {
    endpoint += `?brandId=${brandId}`;
  }
  return await apiClient(endpoint);
};

export const createProductCategory = async (data: any) => {
  return await apiClient('/product-categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateProductCategory = async (id: number, data: any) => {
  return await apiClient(`/product-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteProductCategory = async (id: number) => {
  return await apiClient('/product-categories/' + id, {
    method: 'DELETE',
  });
};
