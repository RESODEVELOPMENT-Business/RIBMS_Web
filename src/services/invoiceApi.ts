import { invoiceApi } from './invoiceApiClient';

export interface StoreInvoiceSettings {
  isExportInvoice: boolean;
  exportMode: number; // 0 = Individual, 1 = Merged
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
}

export const getInvoiceStatistics = async (fromDate?: string, toDate?: string) => {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  return await invoiceApi.get<{ data: InvoiceStatisticsDto }>(`/statistics/invoices?${params.toString()}`);
};
