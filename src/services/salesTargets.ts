import { apiClient } from './apiClient';

export interface SalesTarget {
  id: number;
  brandId: number;
  storeId?: number | null;
  storeName?: string;
  year: number;
  month: number;
  targetRevenue: number;
  targetOrderCount: number;
  targetAov: number;
  weekendMultiplier: number;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface SalesTargetPayload {
  brandId?: number;
  storeId?: number | null;
  year: number;
  month: number;
  targetRevenue: number;
  targetOrderCount: number;
  targetAov?: number | null;
  weekendMultiplier?: number;
  notes?: string | null;
}

export interface MonthlyTargetSummary {
  year: number;
  month: number;
  storeId?: number | null;
  storeName: string;
  daysInMonth: number;
  elapsedDays: number;
  targetRevenue: number;
  actualRevenue: number;
  remainingRevenue: number;
  revenueCompletionRate: number;
  targetOrderCount: number;
  actualOrderCount: number;
  remainingOrders: number;
  orderCompletionRate: number;
  targetAov: number;
  actualAov: number;
  achievedDays: number;
  missedDays: number;
  totalWeeks: number;
  achievedWeeks: number;
  missedWeeks: number;
}

export interface DailyTargetProgress {
  date: string;
  dateStr: string;
  dayNumber: number;
  dayOfWeek: string;
  isWeekend: boolean;
  targetRevenue: number;
  actualRevenue: number;
  revenueVariance: number;
  isRevenueAchieved: boolean;
  targetOrderCount: number;
  actualOrderCount: number;
  orderVariance: number;
  isOrderAchieved: boolean;
  targetAov: number;
  actualAov: number;
  isAchieved: boolean;
}

export interface WeeklyTargetProgress {
  weekNumber: number;
  weekLabel: string;
  fromDate: string;
  toDate: string;
  targetRevenue: number;
  actualRevenue: number;
  revenueVariance: number;
  isRevenueAchieved: boolean;
  targetOrderCount: number;
  actualOrderCount: number;
  orderVariance: number;
  isOrderAchieved: boolean;
  targetAov: number;
  actualAov: number;
  isAchieved: boolean;
}

export interface SalesTargetProgressResponse {
  summary: MonthlyTargetSummary;
  dailyBreakdown: DailyTargetProgress[];
  weeklyBreakdown: WeeklyTargetProgress[];
}

export interface ApiResponse<T = unknown> {
  status: number;
  message?: string;
  data?: T;
}

export const getSalesTargets = async (params?: {
  storeId?: number;
  year?: number;
  month?: number;
}) => {
  const queryParts: string[] = [];
  if (params?.storeId) queryParts.push(`storeId=${params.storeId}`);
  if (params?.year) queryParts.push(`year=${params.year}`);
  if (params?.month) queryParts.push(`month=${params.month}`);
  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return apiClient<ApiResponse<SalesTarget[]>>(`/sales-targets${query}`);
};

export const createOrUpdateSalesTarget = async (data: SalesTargetPayload) => {
  return apiClient<ApiResponse>('/sales-targets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteSalesTarget = async (id: number) => {
  return apiClient<ApiResponse>(`/sales-targets/${id}`, {
    method: 'DELETE',
  });
};

export const getSalesTargetProgress = async (params: {
  year: number;
  month: number;
  storeId?: number;
}) => {
  const queryParts: string[] = [
    `year=${params.year}`,
    `month=${params.month}`,
  ];
  if (params.storeId) queryParts.push(`storeId=${params.storeId}`);
  const query = `?${queryParts.join('&')}`;
  return apiClient<ApiResponse<SalesTargetProgressResponse>>(
    `/orders/dashboard/sales-target-progress${query}`,
  );
};
