import { invoiceApi } from './invoiceApiClient';

export interface StoreInvoiceSettings {
  isExportInvoice: boolean;
  exportMode: number; // 0 = Individual, 1 = Merged
  paymentMethodExportConfig?: string | null;
  exportTimeFrom?: string | null;
  exportTimeTo?: string | null;
  isTimeRestricted?: boolean;
}

export interface InvoiceBrandDto {
  id: string;
  name: string;
  code: string;
  taxCode?: string;
}

export interface InvoiceStoreDto {
  id: string;
  name: string;
  code: string;
  address: string;
  phone?: string;
  email?: string;
  isExportInvoice: boolean;
  exportMode: number;
  organizationName?: string;
  paymentMethodExportConfig?: string | null;
  exportTimeFrom?: string | null;
  exportTimeTo?: string | null;
  isTimeRestricted: boolean;
}

export const getInvoiceBrands = async () => {
  return await invoiceApi.get<{ data: InvoiceBrandDto[] }>(`/brands`);
};

export const getInvoiceStoresByBrandCode = async (brandCode: string) => {
  return await invoiceApi.get<{ data: InvoiceStoreDto[] }>(`/brands/${brandCode}/stores`);
};

export const updateStoreInvoiceSettings = async (storeId: string, data: StoreInvoiceSettings) => {
  return await invoiceApi.put(`/stores/${storeId}/export-settings`, data);
};

export const triggerSyncBrandsAndStores = async () => {
  return await invoiceApi.post<{ data: { success: boolean; message: string; jobId: string } }>(`/jobs/trigger-sync-brands-and-stores`);
};

export interface InvoiceStatisticsDto {
  totalInvoicedAmount: number;
  totalUninvoicedAmount: number;
  totalOrders: number;
  totalInvoices: number;
  successInvoices: number;
  failedInvoices: number;
  byBrand: BrandStatisticsDto[];
  byDay: DailyStatisticsDto[];
  topStores: StoreStatisticsDto[];
}

export interface BrandStatisticsDto {
  brandName: string;
  brandId: string;
  invoicedAmount: number;
  invoiceCount: number;
  orderCount: number;
}

export interface DailyStatisticsDto {
  date: string;
  invoicedAmount: number;
  invoiceCount: number;
  orderCount: number;
}

export interface StoreStatisticsDto {
  storeName: string;
  storeCode: string;
  invoicedAmount: number;
  invoiceCount: number;
  totalOrders: number;
  totalSales: number;
  uninvoicedAmount: number;
  exportedOrderCount: number;
  unexportedOrderCount: number;
  unexportedOrderCodes?: string[];
}

export const getInvoiceStatistics = async (fromDate?: string, toDate?: string) => {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  return await invoiceApi.get<{ data: InvoiceStatisticsDto }>(`/statistics/invoices?${params.toString()}`);
};

export interface InvoiceDto {
  id: string;
  invoiceCode: string;
  createdDate: string;
  lookupCode?: string;
  type?: number;
  status: number;
  paymentMethod?: string;
  totalAmount: number;
  totalTaxAmount: number;
  totalAmountAfterTax: number;
  billCode: string;
  storeId: string;
  storeName: string;
  storeCode: string;
  buyerName?: string;
  buyerTaxCode?: string;
}

export interface PaginatedList<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const getInvoices = async (params: {
  pageNumber?: number;
  pageSize?: number;
  storeId?: string;
  fromDate?: string;
  toDate?: string;
  status?: number;
  searchKey?: string;
}) => {
  const query = new URLSearchParams();
  if (params.pageNumber !== undefined) query.append('pageNumber', params.pageNumber.toString());
  if (params.pageSize !== undefined) query.append('pageSize', params.pageSize.toString());
  if (params.storeId) query.append('storeId', params.storeId);
  if (params.fromDate) query.append('fromDate', params.fromDate);
  if (params.toDate) query.append('toDate', params.toDate);
  if (params.status !== undefined) query.append('status', params.status.toString());
  if (params.searchKey) query.append('searchKey', params.searchKey);

  return await invoiceApi.get<{ data: PaginatedList<InvoiceDto> }>(`/invoices?${query.toString()}`);
};

