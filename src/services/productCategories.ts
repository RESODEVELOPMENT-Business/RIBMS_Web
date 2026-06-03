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

export const createProductCategory = async (data: any | FormData) => {
  const isFormData = data instanceof FormData;
  return await apiClient('/product-categories', {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  });
};

export const updateProductCategory = async (id: number, data: any | FormData) => {
  const isFormData = data instanceof FormData;
  return await apiClient(`/product-categories/${id}`, {
    method: 'PUT',
    body: isFormData ? data : JSON.stringify(data),
  });
};

export const deleteProductCategory = async (id: number) => {
  return await apiClient('/product-categories/' + id, {
    method: 'DELETE',
  });
};
