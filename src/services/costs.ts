import { apiClient } from './apiClient';

// ─── Type Definitions ────────────────────────────────────────────────

/** 0 = chi phí cố định (VND); 1 = chi phí theo % doanh thu dự kiến. */
export type CostCategoryType = 0 | 1;

export interface CostCategory {
  catId: number;
  catName: string;
  type: CostCategoryType | null;
  active: boolean;
  brandId: number | null;
}

export interface Cost {
  costId: number;
  catId: number;
  catName: string;
  catType: CostCategoryType | null;
  amount: number;
  costDescription?: string | null;
  costDate: string;
  costStatus: number;
  storeId: number | null;
}

export interface CreateCostRequest {
  storeId: number;
  catId: number;
  amount: number;
  costDescription?: string;
  costDate?: string;
  costStatus?: number;
}

export interface UpdateCostRequest {
  catId?: number;
  amount?: number;
  costDescription?: string;
  costDate?: string;
  costStatus?: number;
}

export interface CreateCostCategoryRequest {
  catName: string;
  type: CostCategoryType;
}

export interface UpdateCostCategoryRequest {
  catName: string;
  type: CostCategoryType;
}

// ─── Cost Categories ──────────────────────────────────────────────────

export const getCostCategories = async (page = 1, size = 20, brandId?: number) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (brandId) params.set('brandId', String(brandId));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return await apiClient(`/cost-categories${qs}`);
};

export const getCostCategoryById = async (id: number | string) => {
  return await apiClient(`/cost-categories/${id}`);
};

export const createCostCategory = async (data: CreateCostCategoryRequest) => {
  return await apiClient('/cost-categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateCostCategory = async (id: number, data: UpdateCostCategoryRequest) => {
  return await apiClient(`/cost-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteCostCategory = async (id: number) => {
  return await apiClient(`/cost-categories/${id}`, {
    method: 'DELETE',
  });
};

// ─── Costs ────────────────────────────────────────────────────────────

export const getCostsByStore = async (storeId: number) => {
  return await apiClient(`/costs/store/${storeId}`);
};

export const createCost = async (data: CreateCostRequest) => {
  return await apiClient('/costs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateCost = async (id: number, data: UpdateCostRequest) => {
  return await apiClient(`/costs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteCost = async (id: number) => {
  return await apiClient(`/costs/${id}`, {
    method: 'DELETE',
  });
};

// ─── Danh mục chi phí mặc định (seed nhanh) ───────────────────────────
// type: 0 = VND cố định, 1 = % doanh thu.
export const DEFAULT_COST_CATEGORIES: CreateCostCategoryRequest[] = [
  { catName: 'Tiền lương nhân viên bán hàng', type: 0 },
  { catName: 'Chi phí thưởng nhân viên', type: 0 },
  { catName: 'Chi phí mặt bằng', type: 0 },
  { catName: 'Chi phí vật tư lẻ', type: 0 },
  { catName: 'Chi phí công cụ dụng cụ sản xuất', type: 0 },
  { catName: 'Chi phí khác (dịch vụ)', type: 0 },
  { catName: 'Chi phí điện', type: 0 },
  { catName: 'Chi phí nước', type: 0 },
  { catName: 'Chi phí điện thoại, internet, IT Support', type: 0 },
  { catName: 'Chi phí bảo vệ, giữ xe, bãi xe', type: 0 },
  { catName: 'Chi phí ký bill', type: 0 },
  { catName: 'Chi phí sửa chữa, bảo trì, bổ sung thiết bị', type: 0 },
  { catName: 'Chi phí 3% Marketing', type: 1 },
  { catName: 'Chi phí nguyên vật liệu 30%', type: 1 },
];
