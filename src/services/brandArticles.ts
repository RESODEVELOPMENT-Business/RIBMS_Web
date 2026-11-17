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
  startDate?: string | null;
  endDate?: string | null;
  blocks: BrandArticleBlock[];
  cta?: BrandArticleCta | null;
};

export type BrandArticleStatus =
  | 'Draft'
  | 'Published'
  | 'Unpublished'
  | 'Scheduled'
  | 'Expired'
  | string;

export type BrandArticleListItem = {
  id: number;
  brandId: number;
  storeId: number;
  title: string;
  coverImageUrl?: string | null;
  status: BrandArticleStatus;
  hasUnpublishedChanges: boolean;
  publishedAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  updatedAt: string;
  etag: string;
  eTag?: string;
};

export type BrandArticleDetail = {
  id: number;
  brandId: number;
  storeId: number;
  title?: string;
  status: BrandArticleStatus;
  hasUnpublishedChanges: boolean;
  publishedAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  updatedAt: string;
  etag: string;
  eTag?: string;
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
  { key: 'auth', label: 'Màn hình Đăng ký / Đăng nhập' },
  { key: 'home', label: 'Màn hình Trang chủ' },
];

const normalizeArticleDetail = (
  res: ApiResponse<BrandArticleDetail>,
): ApiResponse<BrandArticleDetail> => {
  if (res.data) {
    const raw = res.data as BrandArticleDetail & { eTag?: string; ETag?: string };
    const resolvedEtag = raw.etag || raw.eTag || raw.ETag || '';
    res.data.etag = resolvedEtag;
  }
  return res;
};

export const getBrandArticles = async (params?: {
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
  const res = await apiClient<ApiResponse<BrandArticleListResponse>>(url);
  if (res.data?.items) {
    res.data.items = res.data.items.map((item) => {
      const raw = item as BrandArticleListItem & { eTag?: string; ETag?: string };
      return {
        ...item,
        etag: raw.etag || raw.eTag || raw.ETag || '',
      };
    });
  }
  return res;
};

export const getBrandArticleById = async (id: number) => {
  const res = await apiClient<ApiResponse<BrandArticleDetail>>(
    `${BRAND_ARTICLES_ENDPOINT}/${id}`,
  );
  return normalizeArticleDetail(res);
};

export const createBrandArticleDraft = async (draft: BrandArticleSnapshot) => {
  const res = await apiClient<ApiResponse<BrandArticleDetail>>(
    BRAND_ARTICLES_ENDPOINT,
    {
      method: 'POST',
      body: JSON.stringify({ draft }),
    },
  );
  return normalizeArticleDetail(res);
};

export const saveBrandArticleDraft = async (
  id: number,
  etag: string,
  draft: BrandArticleSnapshot,
) => {
  const cleanEtag = (etag || '').trim().replace(/^"|"$/g, '');
  etag = cleanEtag;
  const res = await apiClient<ApiResponse<BrandArticleDetail>>(
    `${BRAND_ARTICLES_ENDPOINT}/${id}`,
    {
      method: 'PUT',
      headers: {
        'If-Match': `"${etag}"`,
      },
      body: JSON.stringify({ etag, draft }),
    },
  );
  return normalizeArticleDetail(res);
};

export const publishBrandArticle = async (id: number, etag: string) => {
  const cleanEtag = (etag || '').trim().replace(/^"|"$/g, '');
  etag = cleanEtag;
  const res = await apiClient<ApiResponse<BrandArticleDetail>>(
    `${BRAND_ARTICLES_ENDPOINT}/${id}/publish`,
    {
      method: 'POST',
      headers: {
        'If-Match': `"${etag}"`,
      },
      body: JSON.stringify({ etag }),
    },
  );
  return normalizeArticleDetail(res);
};

export const unpublishBrandArticle = async (id: number, etag: string) => {
  const cleanEtag = (etag || '').trim().replace(/^"|"$/g, '');
  etag = cleanEtag;
  const res = await apiClient<ApiResponse<BrandArticleDetail>>(
    `${BRAND_ARTICLES_ENDPOINT}/${id}/unpublish`,
    {
      method: 'POST',
      headers: {
        'If-Match': `"${etag}"`,
      },
      body: JSON.stringify({ etag }),
    },
  );
  return normalizeArticleDetail(res);
};

export const deleteBrandArticle = async (id: number) => {
  return apiClient<ApiResponse<null>>(`${BRAND_ARTICLES_ENDPOINT}/${id}`, {
    method: 'DELETE',
  });
};

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
