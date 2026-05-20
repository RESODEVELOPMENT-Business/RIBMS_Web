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
