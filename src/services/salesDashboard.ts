import { apiClient } from './apiClient';

// ── Types ────────────────────────────────────────────────────────

export interface SalesRevenueSection {
  totalAmountBeforeDiscount: number;
  promotionDiscount: number;
  salesDiscount: number;
  totalDiscount: number;
  actualRevenue: number;
}

export interface InvoiceCountSection {
  total: number;
  atStore: number;
  takeAway: number;
  delivery: number;
}

export interface PaymentMethodRevenue {
  paymentType: number;
  paymentTypeName: string;
  amount: number;
  transactionCount: number;
}

export interface TopStoreRevenueItem {
  storeId: number;
  storeName: string;
  districtName: string;
  totalProducts: number;
  salesInvoices: number;
  averageBill: number;
  revenueBeforeDiscount: number;
  discount: number;
  revenueAfterDiscount: number;
  cardTopUpInvoices: number;
  cardTopUpRevenue: number;
}

export interface StorePaymentMethodItem {
  storeId: number;
  storeName: string;
  cashFromSales: number;
  cashFromCardTopUp: number;
  ttvUsage: number;
  bank: number;
  momo: number;
  grabpay: number;
  grabfood: number;
  vnPay: number;
  baeMin: number;
  shopeepay: number;
  zaloPay: number;
}

// Data returned by the core sales overview dashboard
export interface SalesDashboardData {
  revenue: SalesRevenueSection;
  invoices: InvoiceCountSection;
  paymentMethodRevenues: PaymentMethodRevenue[];
}

// ── API ──────────────────────────────────────────────────────────

export const getSalesDashboard = async (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  
  const endpoint = `/orders/dashboard?${params.toString()}`;
  return await apiClient(endpoint);
};

export const getTopStoreRevenues = async (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  
  const endpoint = `/orders/dashboard/top-store-revenues?${params.toString()}`;
  return await apiClient(endpoint);
};

export const getStorePaymentMethods = async (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  
  const endpoint = `/orders/dashboard/store-payment-methods?${params.toString()}`;
  return await apiClient(endpoint);
};
