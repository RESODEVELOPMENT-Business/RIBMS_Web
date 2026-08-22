import { apiClient } from './apiClient';

export interface FeedbackQuestion {
  id: number;
  brandId: number;
  title: string;
  questionType: number; // 1: StarRating, 2: SingleChoice, 3: MultiChoice, 4: FreeText
  optionsJson?: string | null;
  sortOrder: number;
  isRequired: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CustomerReviewItem {
  id: number;
  brandId: number;
  storeId: number;
  storeName: string;
  customerPhone: string;
  customerName?: string | null;
  ratingScore: number;
  answersJson: string;
  voucherCode?: string | null;
  createdAt: string;
}

export interface StoreFeedbackSummary {
  storeId: number;
  storeName: string;
  totalReviews: number;
  averageRating: number;
  satisfactionRate: number;
  voucherCount: number;
}

export interface FeedbackReportSummary {
  totalReviews: number;
  averageRating: number;
  positiveReviewCount: number;
  neutralReviewCount: number;
  negativeReviewCount: number;
  satisfactionRate: number;
  totalVouchersIssued: number;
  storeSummaries: StoreFeedbackSummary[];
  recentReviews: CustomerReviewItem[];
}

export interface PublicFeedbackRewardInfo {
  isRewardEnabled: boolean;
  rewardType: number;
  title: string;
  description?: string | null;
  discountRate: number;
  discountAmount: number;
  expirationDays: number;
}

export interface FeedbackRewardConfig {
  id: number;
  brandId: number;
  isRewardEnabled: boolean;
  rewardType: number; // 1: DiscountPercent, 2: DiscountAmount, 3: LoyaltyPoints, 4: CustomMessageOnly
  discountRate: number;
  discountAmount: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  expirationDays: number;
  cooldownDays: number;
  voucherCodePrefix: string;
  customRewardTitle?: string | null;
  customRewardDescription?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface PublicFeedbackInitialData {
  brandId: number;
  brandName: string;
  storeId?: number | null;
  storeName: string;
  storeAddress: string;
  questions: FeedbackQuestion[];
  rewardInfo?: PublicFeedbackRewardInfo | null;
}

export interface SubmitFeedbackPayload {
  brandId: number;
  storeId: number;
  customerPhone: string;
  customerName?: string;
  ratingScore: number;
  answersJson: string;
  deviceFingerprint?: string;
  ipAddress?: string;
}

export interface SubmitFeedbackResponse {
  isRewardGranted: boolean;
  rewardType: number;
  rewardTitle: string;
  rewardDescription?: string | null;
  voucherCode: string;
  discountRate: number;
  discountAmount: number;
  expirationDays: number;
  expiryDate: string;
  storeName: string;
  customerPhone: string;
  pointsAwarded: number;
}

export const getPublicFeedbackQuestions = async (params: { brandId?: number; storeId?: number }) => {
  const query = new URLSearchParams();
  if (params.brandId) query.append('brandId', params.brandId.toString());
  if (params.storeId) query.append('storeId', params.storeId.toString());
  const qs = query.toString();
  return await apiClient(`/public/feedback/questions${qs ? `?${qs}` : ''}`);
};

export const submitPublicFeedback = async (data: SubmitFeedbackPayload) => {
  return await apiClient('/public/feedback/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getAdminFeedbackQuestions = async () => {
  return await apiClient('/admin/feedback/questions');
};

export const createOrUpdateFeedbackQuestion = async (data: Partial<FeedbackQuestion>) => {
  return await apiClient('/admin/feedback/questions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteFeedbackQuestion = async (id: number) => {
  return await apiClient(`/admin/feedback/questions/${id}`, {
    method: 'DELETE',
  });
};

export const getFeedbackReports = async (params?: { storeId?: number; fromDate?: string; toDate?: string }) => {
  const query = new URLSearchParams();
  if (params?.storeId) query.append('storeId', params.storeId.toString());
  if (params?.fromDate) query.append('fromDate', params.fromDate);
  if (params?.toDate) query.append('toDate', params.toDate);
  const qs = query.toString();
  return await apiClient(`/admin/feedback/reports${qs ? `?${qs}` : ''}`);
};

export const getFeedbackConfig = async (brandId?: number) => {
  const query = brandId ? `?brandId=${brandId}` : '';
  return await apiClient(`/admin/feedback/config${query}`);
};

export const updateFeedbackConfig = async (data: Partial<FeedbackRewardConfig>) => {
  return await apiClient('/admin/feedback/config', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

