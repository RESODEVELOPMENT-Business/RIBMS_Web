import { apiClient } from './apiClient';

export interface OrderDetail {
  orderDetailId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  finalAmount: number;
  isAddition: boolean;
}

export interface OrderItem {
  orderId: number;
  invoiceId: string;
  storeId: number;
  orderStatus: number;
  orderType: number;
  checkInDate: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  notes?: string;
  itemCount: number;
  orderDetails: OrderDetail[];
}

export interface PaginatedResult<T> {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  items: T[];
}

export const getOrders = async (
  storeId: number,
  page = 1,
  size = 20,
  status?: number | null,
  fromDate?: string | null,
  toDate?: string | null
): Promise<{ data: PaginatedResult<OrderItem> }> => {
  let endpoint = `/orders?storeId=${storeId}&page=${page}&size=${size}`;
  if (status !== undefined && status !== null) {
    endpoint += `&status=${status}`;
  }
  if (fromDate) {
    endpoint += `&fromDate=${fromDate}`;
  }
  if (toDate) {
    endpoint += `&toDate=${toDate}`;
  }
  return await apiClient(endpoint);
};
