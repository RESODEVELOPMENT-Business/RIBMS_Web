import { apiClient } from './apiClient';
import { MaterialConsumptionReportData, ProductCompositionItem, BrandProductItem } from '@/types/materialReport';

export interface MaterialReportQueryParams {
  storeId?: number;
  brandId?: number;
  fromDate?: string;
  toDate?: string;
  viewMode?: 'material' | 'product' | 'all';
}

export const getMaterialConsumptionReport = async (params: MaterialReportQueryParams) => {
  const searchParams = new URLSearchParams();
  if (params.storeId && params.storeId > 0) searchParams.append('storeId', params.storeId.toString());
  if (params.brandId && params.brandId > 0) searchParams.append('brandId', params.brandId.toString());
  if (params.fromDate) searchParams.append('fromDate', params.fromDate);
  if (params.toDate) searchParams.append('toDate', params.toDate);
  if (params.viewMode) searchParams.append('viewMode', params.viewMode);

  const url = `/reports/material-consumption?${searchParams.toString()}`;
  return await apiClient(url);
};

export const syncHangHoaMaterials = async () => {
  return await apiClient('/product-items/sync', {
    method: 'POST',
  });
};

export const getBrandProductItems = async (page = 1, size = 50, name?: string, active?: boolean) => {
  let url = `/product-items?page=${page}&size=${size}`;
  if (active !== undefined) url += `&active=${active}`;
  if (name && name.trim()) url += `&name=${encodeURIComponent(name.trim())}`;
  return await apiClient(url);
};

export const getProductCompositions = async (productId: number) => {
  return await apiClient(`/products/${productId}/compositions`);
};

export const updateProductCompositions = async (
  productId: number,
  items: Array<{ itemId: number; quantity: number }>
) => {
  return await apiClient(`/products/${productId}/compositions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  });
};

export const cloneProductCompositions = async (sourceProductId: number, targetProductId: number) => {
  return await apiClient('/products/compositions/clone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceProductId, targetProductId }),
  });
};

