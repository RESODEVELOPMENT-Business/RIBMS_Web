import { apiClient } from './apiClient';

export type BrandArticleBlockType = 'heading' | 'paragraph' | 'image';

export type BrandArticleBlock = {
  type: BrandArticleBlockType | string;
  text?: string | null;
  imageUrl?: string | null;
  alt?: string | null;
};

export type BrandArticleCta = {
  label: string;
  routeKey: string;
};

export type BrandArticleSnapshot = {
  schemaVersion: number;
  title: string;
  coverImageUrl?: string | null;
  coverAlt?: string | null;
  blocks: BrandArticleBlock[];
  cta?: BrandArticleCta | null;
};

export type BrandArticleStatus = 'Draft' | 'Published' | 'Unpublished' | string;

export type BrandArticleListItem = {
  id: number;
  brandId: number;
  storeId: number;
  title: string;
  coverImageUrl?: string | null;
  status: BrandArticleStatus;
  hasUnpublishedChanges: boolean;
  publishedAt?: string | null;
  updatedAt: string;
  etag: string;
};

export type BrandArticleDetail = {
  id: number;
  brandId: number;
  storeId: number;
  status: BrandArticleStatus;
  hasUnpublishedChanges: boolean;
  publishedAt?: string | null;
  updatedAt: string;
  etag: string;
  draft: BrandArticleSnapshot;
  published?: BrandArticleSnapshot | null;
};

export type BrandArticleLiveReference = {
  groupKey: string;
  groupLabel: string;
  contentKey: string;
};

export type BrandArticleImageUploadReceipt = {
  storageObjectKey: string;
  imageUrl: string;
  contentType: string;
  byteSize: number;
  width?: number | null;
  height?: number | null;
};

export type BrandArticleListResponse = {
  items: BrandArticleListItem[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};

type ApiResponse<T> = {
  status?: number;
  data?: T;
  message?: string;
};

const BRAND_ARTICLES_ENDPOINT = '/brand/articles';

export const ARTICLE_CTA_ROUTE_OPTIONS: { key: string; label: string }[] = [
  { key: 'menu', label: 'Màn hình Đặt món (Thực đơn)' },
  { key: 'stores', label: 'Màn hình Danh sách cửa hàng' },
  { key: 'myCoupons', label: 'Màn hình Ưu đãi của tôi' },
  { key: 'stampCard', label: 'Màn hình Tích tem đổi quà' },
  { key: 'loyaltyCredits', label: 'Màn hình Tích điểm thành viên' },
  { key: 'home', label: 'Màn hình Trang chủ' },
];

export const getBrandArticles = (params?: {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.size) query.set('size', String(params.size));
  if (params?.search?.trim()) query.set('search', params.search.trim());
  if (params?.status?.trim()) query.set('status', params.status.trim());
  const qs = query.toString();
  const url = qs
    ? `${BRAND_ARTICLES_ENDPOINT}?${qs}`
    : BRAND_ARTICLES_ENDPOINT;
  return apiClient<ApiResponse<BrandArticleListResponse>>(url);
};

export const getBrandArticleById = (id: number) =>
  apiClient<ApiResponse<BrandArticleDetail>>(
    `${BRAND_ARTICLES_ENDPOINT}/${id}`,
  );

export const createBrandArticleDraft = (draft: BrandArticleSnapshot) =>
  apiClient<ApiResponse<BrandArticleDetail>>(BRAND_ARTICLES_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ draft }),
  });

export const saveBrandArticleDraft = (
  id: number,
  etag: string,
  draft: BrandArticleSnapshot,
) =>
  apiClient<ApiResponse<BrandArticleDetail>>(
    `${BRAND_ARTICLES_ENDPOINT}/${id}`,
    {
      method: 'PUT',
      headers: {
        'If-Match': `"${etag}"`,
      },
      body: JSON.stringify({ etag, draft }),
    },
  );

export const publishBrandArticle = (id: number, etag: string) =>
  apiClient<ApiResponse<BrandArticleDetail>>(
    `${BRAND_ARTICLES_ENDPOINT}/${id}/publish`,
    {
      method: 'POST',
      headers: {
        'If-Match': `"${etag}"`,
      },
      body: JSON.stringify({ etag }),
    },
  );

export const unpublishBrandArticle = (id: number, etag: string) =>
  apiClient<ApiResponse<BrandArticleDetail>>(
    `${BRAND_ARTICLES_ENDPOINT}/${id}/unpublish`,
    {
      method: 'POST',
      headers: {
        'If-Match': `"${etag}"`,
      },
      body: JSON.stringify({ etag }),
    },
  );

export const uploadBrandArticleImage = (image: File) => {
  const form = new FormData();
  form.append('Image', image);
  return apiClient<ApiResponse<BrandArticleImageUploadReceipt>>(
    `${BRAND_ARTICLES_ENDPOINT}/upload-image`,
    {
      method: 'POST',
      body: form,
    },
  );
};
