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

export interface PeriodComparisonSection {
  mode: string;
  previousFromDate: string;
  previousToDate: string;
  previousRevenue: number;
  previousInvoiceCount: number;
  previousItemCount: number;
  revenueGrowthRate: number;
  invoiceGrowthRate: number;
  itemGrowthRate: number;
}

export interface TrendBucket {
  bucketStart: string;
  label: string;
  invoiceCount: number;
  revenue: number;
  itemCount: number;
}

export interface TrendSection {
  granularity: 'Day' | 'Week' | 'Month' | 'Year' | string;
  buckets: TrendBucket[];
}

export interface DistrictRevenueItem {
  district: string;
  storeCount: number;
  invoiceCount: number;
  revenue: number;
  sharePercent: number;
}

export type TrendGranularity = 'Day' | 'Week' | 'Month' | 'Year' | 'None';

export interface SalesDashboardData {
  revenue: SalesRevenueSection;
  invoices: InvoiceCountSection;
  paymentMethodRevenues: PaymentMethodRevenue[];
  comparison?: PeriodComparisonSection | null;
  trend?: TrendSection | null;
  districtRevenues?: DistrictRevenueItem[] | null;
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
  paymentMethodRevenues: PaymentMethodRevenue[];
}

// ── BC#2 Orders Report ───────────────────────────────────────────

export interface HourlyRevenueItem {
  hour: number;
  invoiceCount: number;
  revenue: number;
  itemCount: number;
}

export interface DailyRevenueItem {
  date: string;
  invoiceCount: number;
  revenue: number;
  itemCount: number;
}

export interface ShiftRevenueItem {
  shiftCode: string;
  shiftName: string;
  invoiceCount: number;
  revenue: number;
  itemCount: number;
}

export interface OrdersReportData {
  totalInvoices: number;
  totalRevenue: number;
  totalItems: number;
  averageOrderValue: number;
  averageItemsPerOrder: number;
  cancelledOrders: number;
  preCancelledOrders: number;
  cancelRate: number;
  hourlyDistribution: HourlyRevenueItem[];
  shiftDistribution?: ShiftRevenueItem[];
  dailyTrend: DailyRevenueItem[];
}

// ── BC#3 Products Report ─────────────────────────────────────────

export interface ProductSalesItem {
  productId: number;
  productName: string;
  productCode: string;
  categoryName: string;
  generalProductId?: number | null;
  quantity: number;
  revenue: number;
  revenueShare: number;
}

export interface ProductSalesGroupItem {
  parentProductId: number;
  parentProductName: string;
  parentProductCode: string;
  categoryName: string;
  quantity: number;
  revenue: number;
  revenueShare: number;
  childProducts: ProductSalesItem[];
}

export interface CategoryRevenueItem {
  categoryId: number;
  categoryName: string;
  quantity: number;
  revenue: number;
  skuCount: number;
  revenueShare: number;
}

export interface ProductsReportData {
  productsByParent: ProductSalesGroupItem[];
  topSellingProducts: ProductSalesItem[];
  slowMovingProducts: ProductSalesItem[];
  categoryRevenues: CategoryRevenueItem[];
  grandTotalRevenue: number;
  grandTotalQuantity: number;
}

// ── BC#5 Operations Report ───────────────────────────────────────

export interface ShiftPerformanceItem {
  shiftCode: string;
  shiftName: string;
  invoiceCount: number;
  itemCount: number;
  revenue: number;
  averageOrderValue: number;
  averageProcessingMinutes: number;
  sharePercent: number;
}

export interface StoreOperationItem {
  storeId: number;
  storeName: string;
  invoiceCount: number;
  itemCount: number;
  revenue: number;
  averageOrderValue: number;
  averageInvoicesPerHour: number;
  averageProcessingMinutes: number;
  peakHour: number;
  shiftPerformance?: ShiftPerformanceItem[];
}

export interface OperationsReportData {
  totalDaysInRange: number;
  averageInvoicesPerHour: number;
  averageItemsPerHour: number;
  averageProcessingMinutes: number;
  peakHour: number;
  peakHourInvoices: number;
  shiftPerformance: ShiftPerformanceItem[];
  storePerformance: StoreOperationItem[];
}

// ── BC#6 Customer & Marketing Report ─────────────────────────────

export interface ChannelRevenueItem {
  channelCode: number;
  channelName: string;
  invoiceCount: number;
  revenue: number;
  sharePercent: number;
}

export interface PromotionProductItem {
  productId: number;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface PromotionEffectivenessItem {
  promotionId: number;
  promotionCode: string;
  promotionName: string;
  ordersApplied: number;
  totalDiscountAmount: number;
  attributedRevenue: number;
  averageDiscountPerOrder: number;
  topProducts: PromotionProductItem[];
}

export interface CustomerMarketingReportData {
  totalCustomersInPeriod: number;
  newCustomers: number;
  returningCustomers: number;
  returningRate: number;
  averageOrdersPerCustomer: number;
  walkInOrders: number;
  registeredCustomerRevenue: number;
  channelRevenues: ChannelRevenueItem[];
  topPromotions: PromotionEffectivenessItem[];
  marketingCostTotal: number;
  marketingToRevenueRatio: number;
  costBreakdown: MarketingCostBreakdownItem[];
}

export interface MarketingCostBreakdownItem {
  categoryId: number;
  categoryName: string;
  costCount: number;
  total: number;
  isMarketing: boolean;
}

export interface ProfitDataQuality {
  totalProductsWithSales: number;
  productsMissingCogs: number;
  revenueMissingCogs: number;
  missingCogsRevenueShare: number;
}

export interface StoreProfitItem {
  storeId: number;
  storeName: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
}

export interface ProductProfitItem {
  productId: number;
  productName: string;
  productCode: string;
  categoryName: string;
  quantity: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  missingCogs: boolean;
}

export interface CategoryProfitItem {
  categoryName: string;
  quantity: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
}

export interface ProfitBlockData {
  revenueLabel: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  operatingCostTotal: number;
  netProfit: number;
  netMargin: number;
  operatingCosts: CostCategoryBreakdownItem[];
  storeProfits: StoreProfitItem[];
}

export interface ProfitReportData {
  grossSales: number;
  totalDiscount: number;
  netSales: number;
  thuan: ProfitBlockData;
  sauGiam: ProfitBlockData;
  topProfitableProducts: ProductProfitItem[];
  lowestMarginProducts: ProductProfitItem[];
  categoryProfits: CategoryProfitItem[];
  dataQuality: ProfitDataQuality;
}

export interface CostCategoryBreakdownItem {
  categoryId: number;
  categoryName: string;
  costCount: number;
  total: number;
  sharePercent: number;
  isMarketing: boolean;
}

export type ComparisonMode = 'Auto' | 'DoD' | 'WoW' | 'MoM' | 'YoY';

export interface ProfitForecastData {
  // Mốc thời gian (luôn là tháng hiện tại)
  monthStart: string;
  asOfDate: string;
  elapsedDays: number;
  daysInMonth: number;
  // Thực tế (đầu tháng → hiện tại)
  monthToDateNetSales: number;
  avgSalesPerDay: number;
  monthToDateCogs: number;
  monthToDateOperatingCost: number;
  profitToDate: number;
  cogsRatioPercent: number;
  // Dự kiến cuối tháng
  projectedMonthlySales: number;
  projectedWeeklySales: number;
  materialCostRate: number;
  projectedMaterialCost: number;
  projectedOperatingCost: number;
  projectedCostMonthly: number;
  projectedProfitMonthly: number;
  projectedProfitWeekly: number;
  costBreakdown: CostCategoryBreakdownItem[];
}

// ── API ──────────────────────────────────────────────────────────

const buildScopedQuery = (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
  extra?: Record<string, string | number | undefined>,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, v.toString());
      }
    });
  }
  return params.toString();
};

const appendStoreIds = (params: URLSearchParams, storeIds?: number[] | null) => {
  if (storeIds && storeIds.length > 0) {
    storeIds.forEach((id) => params.append('storeIds', id.toString()));
  }
};

export const getSalesDashboard = async (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
  comparisonMode?: ComparisonMode,
  trendGranularity?: TrendGranularity,
  storeIds?: number[] | null,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (comparisonMode) params.append('comparisonMode', comparisonMode);
  if (trendGranularity) params.append('trendGranularity', trendGranularity);
  appendStoreIds(params, storeIds);
  return await apiClient(`/orders/dashboard?${params.toString()}`);
};

export const getTopStoreRevenues = async (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
  storeIds?: number[] | null,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  appendStoreIds(params, storeIds);
  return await apiClient(`/orders/dashboard/top-store-revenues?${params.toString()}`);
};

export const getStorePaymentMethods = async (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
  storeIds?: number[] | null,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  appendStoreIds(params, storeIds);
  return await apiClient(`/orders/dashboard/store-payment-methods?${params.toString()}`);
};

export const getOrdersReport = async (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
  storeIds?: number[] | null,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  appendStoreIds(params, storeIds);
  return await apiClient(`/orders/dashboard/orders-report?${params.toString()}`);
};

export const getProductsReport = async (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
  top: number = 20,
  storeIds?: number[] | null,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (top) params.append('top', top.toString());
  appendStoreIds(params, storeIds);
  return await apiClient(`/orders/dashboard/products-report?${params.toString()}`);
};

export const getOperationsReport = async (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
  storeIds?: number[] | null,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (storeIds && storeIds.length > 0) {
    storeIds.forEach((id) => params.append('storeIds', id.toString()));
  }
  return await apiClient(`/orders/dashboard/operations-report?${params.toString()}`);
};

export const getCustomerMarketingReport = async (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
  topPromotions: number = 10,
  storeIds?: number[] | null,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (topPromotions) params.append('topPromotions', topPromotions.toString());
  appendStoreIds(params, storeIds);
  return await apiClient(`/orders/dashboard/customer-marketing-report?${params.toString()}`);
};

export const getProfitReport = async (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
  top: number = 20,
  storeIds?: number[] | null,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (top) params.append('top', top.toString());
  appendStoreIds(params, storeIds);
  return await apiClient(`/orders/dashboard/profit-report?${params.toString()}`);
};

export const getProfitForecast = async (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
  storeIds?: number[] | null,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  appendStoreIds(params, storeIds);
  return await apiClient(`/orders/dashboard/profit-forecast?${params.toString()}`);
};

// ── Daily operations report ──────────────────────────────────────

export interface DailyPaymentTypeColumn {
  paymentTypeId: number;
  name: string;
  total: number;
}

export interface DailyOperationRow {
  date: string;
  dayOfWeek: number;
  dayLabel: string;
  slot6To10: number;
  slot10To14: number;
  slot14To18: number;
  slot18To22: number;
  /** Aligned with DailyOperationsReportData.paymentTypes order. */
  paymentAmounts: number[];
  discount: number;
  netSales: number;
  billCount: number;
  averageBill: number;
}

export interface DailyOperationsReportData {
  fromDate: string;
  toDate: string;
  grossSales: number;
  totalDiscount: number;
  netSales: number;
  totalBills: number;
  averageBill: number;
  profitToDate: number;
  projectedMonthlyProfit: number;
  slot6To10: number;
  slot10To14: number;
  slot14To18: number;
  slot18To22: number;
  paymentTypes: DailyPaymentTypeColumn[];
  rows: DailyOperationRow[];
}

export const getDailyOperationsReport = async (
  storeId?: number | null,
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
  storeIds?: number[] | null,
) => {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId.toString());
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  appendStoreIds(params, storeIds);
  return await apiClient(`/orders/dashboard/daily-operations-report?${params.toString()}`);
};

// ── Weekly 9-weeks breakdown ──────────────────────────────────────

export interface WeekHeader {
  weekKey: string;
  label: string;
  startDate: string;
  endDate: string;
}

export interface StoreWeeklyRow {
  storeId: number;
  storeName: string;
  revenueByWeek: number[];
  invoiceCountByWeek: number[];
  avgBillByWeek: number[];
}

export interface WeeklyTotalsRow {
  revenueByWeek: number[];
  invoiceCountByWeek: number[];
  avgBillByWeek: number[];
}

export interface WeeklyBreakdownData {
  weeks: WeekHeader[];
  stores: StoreWeeklyRow[];
  totals: WeeklyTotalsRow;
}

export const getWeeklyBreakdown = async (
  brandId?: number | null,
  fromDate?: string,
  toDate?: string,
  storeIds?: number[] | null,
) => {
  const params = new URLSearchParams();
  if (brandId) params.append('brandId', brandId.toString());
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (storeIds && storeIds.length > 0) {
    storeIds.forEach((id) => params.append('storeIds', id.toString()));
  }
  return await apiClient(`/orders/dashboard/weekly-breakdown?${params.toString()}`);
};
