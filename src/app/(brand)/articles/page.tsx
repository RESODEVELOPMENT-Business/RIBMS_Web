'use client';
/* eslint-disable @next/next/no-img-element -- admin preview renders signed storage URLs and local object URLs */

import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { optimizeImageForUpload } from '@/services/imageOptimizer';
import {
  ARTICLE_CTA_ROUTE_OPTIONS,
  createBrandArticleDraft,
  deleteBrandArticle,
  getBrandArticleById,
  getBrandArticles,
  publishBrandArticle,
  saveBrandArticleDraft,
  unpublishBrandArticle,
  uploadBrandArticleImage,
  type BrandArticleBlockType,
  type BrandArticleDetail,
  type BrandArticleListItem,
  type BrandArticleLiveReference,
  type BrandArticleSnapshot,
  type BrandArticleStatus,
} from '@/services/brandArticles';

type EditableBlock = {
  localId: string;
  type: BrandArticleBlockType;
  text: string;
  imageUrl: string;
  alt: string;
  uploading: boolean;
};

type ConflictState = {
  kind: 'etag' | 'liveReferences';
  message: string;
  latestServerEtag?: string;
  liveReferences?: BrandArticleLiveReference[];
};

const statusLabels: Record<string, { label: string; className: string }> = {
  Draft: {
    label: 'Bản nháp',
    className:
      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  Published: {
    label: 'Đã xuất bản',
    className:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  Scheduled: {
    label: 'Đã lên lịch',
    className:
      'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
  },
  Expired: {
    label: 'Đã hết hạn',
    className:
      'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  },
  Unpublished: {
    label: 'Đã gỡ xuất bản',
    className:
      'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  },
};

const blockTypeLabels: Record<BrandArticleBlockType, string> = {
  heading: 'Tiêu đề đoạn (Heading)',
  paragraph: 'Đoạn văn (Paragraph)',
  image: 'Hình ảnh (Image)',
};

function makeLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toLocalDatetimeInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoString(val?: string | null): string | null {
  if (!val || !val.trim()) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BrandArticlesPage() {
  const user = useAuthStore((state) => state.user);

  const [articles, setArticles] = useState<BrandArticleListItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingList, setLoadingList] = useState(true);

  const [editorMode, setEditorMode] = useState<'closed' | 'create' | 'edit'>(
    'closed',
  );
  const [activeArticle, setActiveArticle] =
    useState<BrandArticleDetail | null>(null);
  const [etag, setEtag] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverAlt, setCoverAlt] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [ctaEnabled, setCtaEnabled] = useState(false);
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaRouteKey, setCtaRouteKey] = useState('menu');
  const [dirty, setDirty] = useState(false);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState<ConflictState | null>(null);

  const hydrateEditorFromSnapshot = useCallback(
    (
      snapshot: BrandArticleSnapshot,
      nextDetail: (BrandArticleDetail & { eTag?: string; ETag?: string }) | null,
    ) => {
      const resolvedEtag =
        nextDetail?.etag || nextDetail?.eTag || nextDetail?.ETag || '';
      setActiveArticle(
        nextDetail ? { ...nextDetail, etag: resolvedEtag } : null,
      );
      setEtag(resolvedEtag);
      setTitle(snapshot.title ?? '');
      setCoverImageUrl(snapshot.coverImageUrl ?? '');
      setCoverAlt(snapshot.coverAlt ?? '');
      setStartDate(toLocalDatetimeInput(snapshot.startDate));
      setEndDate(toLocalDatetimeInput(snapshot.endDate));
      setBlocks(
        (snapshot.blocks ?? []).map((b, idx) => ({
          localId: makeLocalId(`blk-${idx}`),
          type:
            b.type === 'heading' || b.type === 'image' ? b.type : 'paragraph',
          text: b.text ?? '',
          imageUrl: b.imageUrl ?? '',
          alt: b.alt ?? '',
          uploading: false,
        })),
      );
      if (snapshot.cta && (snapshot.cta.label || snapshot.cta.routeKey)) {
        setCtaEnabled(true);
        setCtaLabel(snapshot.cta.label ?? '');
        setCtaRouteKey(snapshot.cta.routeKey || 'menu');
      } else {
        setCtaEnabled(false);
        setCtaLabel('');
        setCtaRouteKey('menu');
      }
      setDirty(false);
      setConflict(null);
    },
    [],
  );

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await getBrandArticles({
        page: 1,
        size: 50,
        search,
        status: statusFilter,
      });
      setArticles(res.data?.items ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không tải được danh sách Bài viết thương hiệu.',
      );
    } finally {
      setLoadingList(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    if (user?.role === 'BrandManager') {
      void loadList();
    }
  }, [loadList, user?.role]);

  useEffect(() => {
    if (!dirty || editorMode === 'closed') return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty, editorMode]);

  const currentSnapshot = useMemo<BrandArticleSnapshot>(
    () => ({
      schemaVersion: 1,
      title: title.trim(),
      coverImageUrl: coverImageUrl.trim() || null,
      coverAlt: coverAlt.trim() || null,
      startDate: toIsoString(startDate),
      endDate: toIsoString(endDate),
      blocks: blocks.map((b) =>
        b.type === 'image'
          ? {
              type: 'image',
              imageUrl: b.imageUrl.trim() || null,
              alt: b.alt.trim() || null,
            }
          : {
              type: b.type,
              text: b.text,
            },
      ),
      cta: ctaEnabled
        ? {
            label: ctaLabel.trim(),
            routeKey: ctaRouteKey.trim(),
          }
        : null,
    }),
    [
      blocks,
      coverAlt,
      coverImageUrl,
      ctaEnabled,
      ctaLabel,
      ctaRouteKey,
      endDate,
      startDate,
      title,
    ],
  );

  if (user?.role === 'Administrator') return null;
  if (user?.role && user.role !== 'BrandManager') {
    return (
      <div className="p-6 text-error-600">
        Bạn không có quyền quản lý Bài viết thương hiệu.
      </div>
    );
  }

  const startNewArticle = () => {
    setMessage('');
    setError('');
    setConflict(null);
    setEditorMode('create');
    hydrateEditorFromSnapshot(
      {
        schemaVersion: 1,
        title: '',
        coverImageUrl: null,
        coverAlt: null,
        startDate: null,
        endDate: null,
        blocks: [
          {
            type: 'paragraph',
            text: '',
          },
        ],
        cta: null,
      },
      null,
    );
  };

  const openArticleForEdit = async (id: number) => {
    setBusy(true);
    setMessage('');
    setError('');
    setConflict(null);
    try {
      const res = await getBrandArticleById(id);
      const detail = res.data;
      if (!detail) {
        throw new Error('Không tìm thấy chi tiết bài viết.');
      }
      const resolvedEtag =
        detail.etag || (detail as unknown as { eTag?: string }).eTag || '';
      setEditorMode('edit');
      hydrateEditorFromSnapshot(detail.draft, {
        ...detail,
        etag: resolvedEtag,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không tải được chi tiết bài viết.',
      );
    } finally {
      setBusy(false);
    }
  };

  const reloadLatestServerVersion = async () => {
    if (!activeArticle?.id) return;
    await openArticleForEdit(activeArticle.id);
    setMessage('Đã tải lại phiên bản mới nhất trên máy chủ.');
  };

  const handleUploadCover = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError('');
    try {
      const optimized = await optimizeImageForUpload(file, {
        preset: 'banner',
      });
      const res = await uploadBrandArticleImage(optimized);
      const uploadedUrl =
        res.data?.imageUrl || res.data?.storageObjectKey || '';
      if (!uploadedUrl) {
        throw new Error(res.message || 'Tải ảnh bìa thất bại.');
      }
      setCoverImageUrl(uploadedUrl);
      setDirty(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không tải được ảnh bìa lên kho.',
      );
    } finally {
      setUploadingCover(false);
      event.target.value = '';
    }
  };

  const handleAddBlock = (type: BrandArticleBlockType) => {
    if (blocks.length >= 50) {
      setError('Mỗi bài viết tối đa 50 khối nội dung.');
      return;
    }
    setBlocks((prev) => [
      ...prev,
      {
        localId: makeLocalId(type),
        type,
        text: '',
        imageUrl: '',
        alt: '',
        uploading: false,
      },
    ]);
    setDirty(true);
  };

  const handleUpdateBlock = (
    localId: string,
    patch: Partial<EditableBlock>,
  ) => {
    setBlocks((prev) =>
      prev.map((blk) => (blk.localId === localId ? { ...blk, ...patch } : blk)),
    );
    setDirty(true);
  };

  const handleMoveBlock = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    setBlocks((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, item);
      return copy;
    });
    setDirty(true);
  };

  const handleRemoveBlock = (localId: string) => {
    setBlocks((prev) => prev.filter((blk) => blk.localId !== localId));
    setDirty(true);
  };

  const handleChangeBlockType = (
    localId: string,
    newType: BrandArticleBlockType,
  ) => {
    setBlocks((prev) =>
      prev.map((blk) =>
        blk.localId === localId ? { ...blk, type: newType } : blk,
      ),
    );
    setDirty(true);
  };

  const handleUploadBlockImage = async (
    localId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleUpdateBlock(localId, { uploading: true });
    setError('');
    try {
      const optimized = await optimizeImageForUpload(file, {
        preset: 'banner',
      });
      const res = await uploadBrandArticleImage(optimized);
      const uploadedUrl =
        res.data?.imageUrl || res.data?.storageObjectKey || '';
      if (!uploadedUrl) {
        throw new Error(res.message || 'Tải ảnh khối nội dung thất bại.');
      }
      handleUpdateBlock(localId, { imageUrl: uploadedUrl, uploading: false });
    } catch (err) {
      handleUpdateBlock(localId, { uploading: false });
      setError(
        err instanceof Error
          ? err.message
          : 'Không tải được ảnh khối nội dung.',
      );
    } finally {
      event.target.value = '';
    }
  };

  const validateClientSide = (requireCompleteForPublish: boolean): string | null => {
    if (!title.trim()) {
      return 'Vui lòng nhập tiêu đề bài viết.';
    }
    if (title.trim().length > 160) {
      return 'Tiêu đề bài viết không được vượt quá 160 ký tự.';
    }
    if (blocks.length > 50) {
      return 'Bài viết tối đa 50 khối nội dung.';
    }
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      if (!Number.isNaN(s) && !Number.isNaN(e) && s > e) {
        return 'Thời gian bắt đầu không được lớn hơn thời gian kết thúc.';
      }
    }
    if (requireCompleteForPublish && blocks.length === 0) {
      return 'Bài viết cần có ít nhất 1 khối nội dung trước khi xuất bản.';
    }
    for (let i = 0; i < blocks.length; i += 1) {
      const blk = blocks[i];
      if (blk.type === 'heading') {
        if (requireCompleteForPublish && !blk.text.trim()) {
          return `Khối #${i + 1} (Tiêu đề đoạn) không được để trống khi xuất bản.`;
        }
        if (blk.text.trim().length > 160) {
          return `Khối #${i + 1} (Tiêu đề đoạn) tối đa 160 ký tự.`;
        }
      } else if (blk.type === 'paragraph') {
        if (requireCompleteForPublish && !blk.text.trim()) {
          return `Khối #${i + 1} (Đoạn văn) không được để trống khi xuất bản.`;
        }
        if (blk.text.trim().length > 4000) {
          return `Khối #${i + 1} (Đoạn văn) tối đa 4000 ký tự.`;
        }
      } else if (blk.type === 'image') {
        if (requireCompleteForPublish && !blk.imageUrl.trim()) {
          return `Khối #${i + 1} (Hình ảnh) chưa chọn tệp ảnh.`;
        }
        if (blk.alt.trim().length > 300) {
          return `Khối #${i + 1} (Mô tả ảnh alt) tối đa 300 ký tự.`;
        }
      }
    }
    if (ctaEnabled) {
      if (!ctaLabel.trim()) {
        return 'Nút hành động (CTA) phải có nhãn hiển thị.';
      }
      if (ctaLabel.trim().length > 80) {
        return 'Nhãn nút hành động (CTA) tối đa 80 ký tự.';
      }
      if (!ctaRouteKey.trim()) {
        return 'Vui lòng chọn màn hình đích cho nút hành động (CTA).';
      }
    }
    return null;
  };

  const handleApiError = (err: unknown, fallbackMsg: string) => {
    const anyErr = err as {
      status?: number;
      message?: string;
      data?: {
        message?: string;
        data?: {
          etag?: string;
          eTag?: string;
          ETag?: string;
          liveReferences?: BrandArticleLiveReference[];
        };
      };
    };
    const msg = anyErr?.data?.message || anyErr?.message || fallbackMsg;

    if (anyErr?.status === 409) {
      const liveRefs = anyErr?.data?.data?.liveReferences;
      if (Array.isArray(liveRefs) && liveRefs.length > 0) {
        setConflict({
          kind: 'liveReferences',
          message: msg,
          liveReferences: liveRefs,
        });
        setError('');
        return;
      }
      const rawConflict = anyErr?.data?.data;
      const latestServerEtag =
        rawConflict?.etag || rawConflict?.eTag || rawConflict?.ETag;
      setConflict({
        kind: 'etag',
        message: msg,
        latestServerEtag,
      });
      setError('');
      return;
    }

    setError(msg);
  };

  const handleDeleteArticle = async (targetId: number, targetTitle?: string) => {
    if (busy) return;
    if (
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function'
    ) {
      const ok = window.confirm(
        `Bạn có chắc muốn xóa vĩnh viễn bài viết "${targetTitle || 'này'}" (#${targetId})?\n\nHành động này không thể hoàn tác. Nếu bài viết đang được gắn trên Trang chủ, hệ thống sẽ chặn thao tác xóa và hiển thị vị trí cần gỡ trước.`,
      );
      if (!ok) return;
    }

    setBusy(true);
    setMessage('');
    setError('');
    setConflict(null);

    try {
      await deleteBrandArticle(targetId);
      setMessage(`Đã xóa bài viết #${targetId} thành công.`);
      if (activeArticle?.id === targetId) {
        setEditorMode('closed');
        setActiveArticle(null);
        setEtag('');
      }
      await loadList();
    } catch (err) {
      handleApiError(err, 'Không thể xóa bài viết.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDraft = async () => {
    if (busy) return;
    const validationErr = validateClientSide(false);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setBusy(true);
    setMessage('');
    setError('');
    setConflict(null);

    try {
      if (editorMode === 'create' || !activeArticle) {
        const createRes = await createBrandArticleDraft(currentSnapshot);
        const created = createRes.data;
        if (!created) {
          throw new Error(createRes.message || 'Không tạo được bản nháp.');
        }
        setEditorMode('edit');
        hydrateEditorFromSnapshot(created.draft, created);
        setMessage('Đã tạo và lưu bản nháp bài viết mới.');
      } else {
        const currentEtag =
          etag ||
          activeArticle.etag ||
          (activeArticle as unknown as { eTag?: string }).eTag ||
          '';
        const saveRes = await saveBrandArticleDraft(
          activeArticle.id,
          currentEtag,
          currentSnapshot,
        );
        const updated = saveRes.data;
        if (!updated) {
          throw new Error(saveRes.message || 'Không lưu được bản nháp.');
        }
        hydrateEditorFromSnapshot(updated.draft, updated);
        setMessage(
          updated.status === 'Published' && updated.hasUnpublishedChanges
            ? 'Đã lưu bản nháp mới. Khách hàng trên ứng dụng vẫn xem bản đã xuất bản trước đó cho đến khi bạn bấm "Xuất bản".'
            : 'Đã lưu bản nháp bài viết.',
        );
      }
      await loadList();
    } catch (err) {
      handleApiError(err, 'Không lưu được bản nháp bài viết.');
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    if (busy) return;
    const validationErr = validateClientSide(true);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setBusy(true);
    setMessage('');
    setError('');
    setConflict(null);

    try {
      let targetId = activeArticle?.id;
      let targetEtag =
        etag ||
        activeArticle?.etag ||
        (activeArticle as unknown as { eTag?: string } | null)?.eTag ||
        '';

      if (editorMode === 'create' || !activeArticle) {
        const createRes = await createBrandArticleDraft(currentSnapshot);
        const created = createRes.data;
        if (!created) {
          throw new Error(
            createRes.message || 'Không tạo được bản nháp trước khi xuất bản.',
          );
        }
        setActiveArticle(created);
        setEditorMode('edit');
        setEtag(
          created.etag ||
            (created as unknown as { eTag?: string }).eTag ||
            '',
        );
        targetId = created.id;
        targetEtag =
          created.etag ||
          (created as unknown as { eTag?: string }).eTag ||
          '';
      } else if (dirty) {
        const saveRes = await saveBrandArticleDraft(
          activeArticle.id,
          targetEtag,
          currentSnapshot,
        );
        const saved = saveRes.data;
        if (!saved) {
          throw new Error(
            saveRes.message || 'Không lưu được bản nháp trước khi xuất bản.',
          );
        }
        targetId = saved.id;
        targetEtag =
          saved.etag ||
          (saved as unknown as { eTag?: string }).eTag ||
          '';
      }

      if (!targetId) {
        throw new Error('Không xác định được mã bài viết để xuất bản.');
      }

      const pubRes = await publishBrandArticle(targetId, targetEtag);
      const published = pubRes.data;
      if (!published) {
        throw new Error(pubRes.message || 'Xuất bản bài viết thất bại.');
      }
      setEditorMode('edit');
      hydrateEditorFromSnapshot(published.draft, published);
      setMessage(
        `Đã xuất bản bài viết #${published.id} thành công. Bây giờ bạn có thể gắn bài viết này vào Trang chủ trong mục Giao diện Mobile.`,
      );
      await loadList();
    } catch (err) {
      handleApiError(err, 'Không thể xuất bản bài viết.');
    } finally {
      setBusy(false);
    }
  };

  const handleUnpublish = async () => {
    if (busy || !activeArticle?.id) return;
    if (
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function'
    ) {
      const ok = window.confirm(
        `Bạn có chắc muốn gỡ xuất bản bài viết "${activeArticle.draft.title}"?\n\nNếu bài viết đang được gắn trên Trang chủ đang hoạt động, hệ thống sẽ chặn thao tác này và hiển thị vị trí cần đổi trước.`,
      );
      if (!ok) return;
    }

    setBusy(true);
    setMessage('');
    setError('');
    setConflict(null);

    try {
      const currentEtag =
        etag ||
        activeArticle.etag ||
        (activeArticle as unknown as { eTag?: string }).eTag ||
        '';
      const res = await unpublishBrandArticle(activeArticle.id, currentEtag);
      const updated = res.data;
      if (updated) {
        hydrateEditorFromSnapshot(updated.draft, updated);
      }
      setMessage(
        'Đã gỡ xuất bản bài viết. Bản nháp vẫn được giữ nguyên để chỉnh sửa hoặc xuất bản lại.',
      );
      await loadList();
    } catch (err) {
      handleApiError(err, 'Không thể gỡ xuất bản bài viết.');
    } finally {
      setBusy(false);
    }
  };

  const renderStatusBadge = (
    status: BrandArticleStatus,
    hasUnpublishedChanges: boolean,
  ) => {
    const info = statusLabels[status] ?? {
      label: status,
      className: 'bg-gray-100 text-gray-700',
    };
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.className}`}
        >
          {info.label}
        </span>
        {status === 'Published' && hasUnpublishedChanges && (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            Có bản nháp mới chưa xuất bản
          </span>
        )}
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bài viết thương hiệu
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Soạn câu chuyện thương hiệu, thông tin ưu đãi và xuất bản để gắn
            trực tiếp vào mục Về chúng tôi, Chương trình ưu đãi hoặc Banner đầu
            trang trên ứng dụng Mobile.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/home-media"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            Gắn vào Giao diện Mobile →
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={startNewArticle}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-50"
          >
            + Tạo bài viết mới
          </button>
        </div>
      </header>

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
        >
          {error}
        </div>
      )}

      {conflict && conflict.kind === 'etag' && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <div>
            <p className="font-bold">
              Phát hiện xung đột phiên bản (409 Conflict)
            </p>
            <p className="mt-0.5 text-xs">
              {conflict.message} Nội dung bạn đang nhập trên màn hình vẫn được
              giữ nguyên để tránh mất dữ liệu.
            </p>
          </div>
          {activeArticle?.id && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void reloadLatestServerVersion()}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-800"
            >
              Tải lại bản trên server
            </button>
          )}
        </div>
      )}

      {conflict && conflict.kind === 'liveReferences' && (
        <div
          role="alert"
          className="space-y-2.5 rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-800 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200"
        >
          <p className="font-bold">{conflict.message}</p>
          <p className="text-xs">
            Các vị trí trên Trang chủ đang liên kết trực tiếp tới bài viết này:
          </p>
          <ul className="list-inside list-disc space-y-1 text-xs font-medium">
            {conflict.liveReferences?.map((ref) => (
              <li key={`${ref.groupKey}-${ref.contentKey}`}>
                <strong>{ref.groupLabel}</strong> (mã ô: {ref.contentKey})
              </li>
            ))}
          </ul>
          <div className="pt-1">
            <Link
              href="/home-media"
              className="inline-flex items-center rounded-lg bg-error-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-error-700"
            >
              Mở Giao diện Mobile để đổi đích đến →
            </Link>
          </div>
        </div>
      )}

      {/* Article List Section */}
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Danh sách bài viết của thương hiệu
            </h2>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {articles.length} bài
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề..."
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái bài viết"
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Draft">Bản nháp</option>
              <option value="Published">Đã xuất bản</option>
              <option value="Scheduled">Đã lên lịch</option>
              <option value="Expired">Đã hết hạn</option>
              <option value="Unpublished">Đã gỡ xuất bản</option>
            </select>
          </div>
        </div>

        {loadingList ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Đang tải danh sách bài viết...
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-500 dark:border-gray-700">
            Chưa có bài viết nào. Bấm <strong>+ Tạo bài viết mới</strong> để
            soạn bài giới thiệu thương hiệu hoặc chương trình ưu đãi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                  <th className="py-2.5 pr-3 font-semibold">Mã</th>
                  <th className="py-2.5 px-3 font-semibold">Bài viết</th>
                  <th className="py-2.5 px-3 font-semibold">Trạng thái</th>
                  <th className="py-2.5 px-3 font-semibold">Xuất bản lúc</th>
                  <th className="py-2.5 px-3 font-semibold">Cập nhật nháp</th>
                  <th className="py-2.5 pl-3 text-right font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {articles.map((item) => {
                  const isSelected = activeArticle?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      className={`transition ${
                        isSelected
                          ? 'bg-brand-50/40 dark:bg-brand-500/10'
                          : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/40'
                      }`}
                    >
                      <td className="py-3 pr-3 font-mono font-semibold text-gray-600 dark:text-gray-300">
                        #{item.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700">
                            {item.coverImageUrl ? (
                              <img
                                src={item.coverImageUrl}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                                Không ảnh
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-gray-900 dark:text-white">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              URL công khai: /bai-viet/{item.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {renderStatusBadge(
                          item.status,
                          item.hasUnpublishedChanges,
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                        {formatDateTime(item.publishedAt)}
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                        {formatDateTime(item.updatedAt)}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void openArticleForEdit(item.id)}
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleDeleteArticle(item.id, item.title)}
                            aria-label={`Xóa bài viết #${item.id}`}
                            title="Xóa bài viết"
                            className="inline-flex items-center rounded-lg border border-error-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-error-600 transition hover:bg-error-50 dark:border-error-500/30 dark:bg-gray-800 dark:text-error-400"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Editor + Live Mobile Phone Preview */}
      {editorMode !== 'closed' && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editorMode === 'create'
                      ? 'Soạn bài viết mới'
                      : `Chỉnh sửa bài viết #${activeArticle?.id}`}
                  </h2>
                  {activeArticle &&
                    renderStatusBadge(
                      activeArticle.status,
                      activeArticle.hasUnpublishedChanges || dirty,
                    )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Bấm <strong>Lưu nháp</strong> để lưu tạm mà không ảnh hưởng
                  bản khách đang đọc. Bấm <strong>Xuất bản</strong> để cập nhật
                  bản công khai trên ứng dụng Mobile.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleSaveDraft()}
                  className="inline-flex min-h-9 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  {busy ? 'Đang xử lý...' : 'Lưu nháp'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handlePublish()}
                  className="inline-flex min-h-9 items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-50"
                >
                  {busy
                    ? 'Đang xuất bản...'
                    : activeArticle?.status === 'Published'
                    ? 'Xuất bản bản nháp mới'
                    : 'Xuất bản'}
                </button>
                {activeArticle?.status === 'Published' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleUnpublish()}
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-error-200 bg-white px-3.5 py-2 text-xs font-semibold text-error-600 transition hover:bg-error-50 disabled:opacity-50 dark:border-error-500/30 dark:bg-gray-800 dark:text-error-400"
                  >
                    Gỡ xuất bản
                  </button>
                )}
                {activeArticle && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handleDeleteArticle(
                        activeArticle.id,
                        activeArticle.draft.title || activeArticle.title,
                      )
                    }
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-error-200 bg-white px-3.5 py-2 text-xs font-semibold text-error-600 transition hover:bg-error-50 disabled:opacity-50 dark:border-error-500/30 dark:bg-gray-800 dark:text-error-400"
                  >
                    Xóa bài viết
                  </button>
                )}
              </div>
            </div>

            {/* Title & Cover Image */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="article-title-input"
                    className="block text-xs font-semibold text-gray-700 dark:text-gray-200"
                  >
                    Tiêu đề bài viết <span className="text-error-600">*</span>
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {title.length}/160
                  </span>
                </div>
                <input
                  id="article-title-input"
                  type="text"
                  maxLength={160}
                  value={title}
                  disabled={busy}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="Ví dụ: Câu chuyện thương hiệu Passion / Ưu đãi Fresh Tea..."
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        Ảnh bìa đầu bài viết (Cover Image)
                      </h3>
                      <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                        📐 Gợi ý: 1200 × 675 px (Tỷ lệ 16:9)
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Kích cỡ đề xuất cho thiết kế: 1200 × 675 px (tỷ lệ 16:9). Tự động chuẩn hóa WebP và giữ nguyên tỷ lệ khung hình tự
                      nhiên trên ứng dụng Mobile.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600">
                      <span>
                        {uploadingCover
                          ? 'Đang tải ảnh bìa...'
                          : coverImageUrl
                          ? 'Thay ảnh bìa'
                          : 'Tải ảnh bìa'}
                      </span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        disabled={busy || uploadingCover}
                        onChange={(e) => void handleUploadCover(e)}
                        className="sr-only"
                      />
                    </label>
                    {coverImageUrl && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setCoverImageUrl('');
                          setCoverAlt('');
                          setDirty(true);
                        }}
                        className="rounded-lg border border-error-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-error-600 hover:bg-error-50 dark:bg-gray-800"
                      >
                        Xóa ảnh bìa
                      </button>
                    )}
                  </div>
                </div>

                {coverImageUrl && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <img
                        src={coverImageUrl}
                        alt={coverAlt || title || 'Ảnh bìa'}
                        className="h-28 w-full object-cover"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Mô tả ảnh bìa (Alt text hỗ trợ truy cập)
                        <input
                          type="text"
                          maxLength={300}
                          value={coverAlt}
                          disabled={busy}
                          onChange={(e) => {
                            setCoverAlt(e.target.value);
                            setDirty(true);
                          }}
                          placeholder="Mô tả ngắn gọn nội dung ảnh bìa..."
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Section */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Thời gian hiển thị & Lên lịch ưu đãi (Tùy chọn)
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Thiết lập thời gian bài viết và banner liên kết tự động hiển thị hoặc tự động ẩn khi hết hạn.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Bắt đầu hiển thị từ
                    <input
                      type="datetime-local"
                      value={startDate}
                      disabled={busy}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDirty(true);
                      }}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                    />
                  </label>
                  <span className="mt-0.5 block text-[11px] text-gray-400">
                    Để trống nếu muốn hiển thị ngay khi xuất bản
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Hết hạn và tự động ẩn lúc
                    <input
                      type="datetime-local"
                      value={endDate}
                      disabled={busy}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setDirty(true);
                      }}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                    />
                  </label>
                  <span className="mt-0.5 block text-[11px] text-gray-400">
                    Sau thời điểm này, bài viết và banner trên Mobile sẽ tự ẩn
                  </span>
                </div>
              </div>
            </div>

            {/* Structured Blocks */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Nội dung bài viết ({blocks.length}/50 khối)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Thêm tiêu đề đoạn, đoạn văn hoặc hình ảnh minh họa và sắp
                    xếp thứ tự bằng nút Lên / Xuống.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busy || blocks.length >= 50}
                    onClick={() => handleAddBlock('heading')}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    + Tiêu đề đoạn
                  </button>
                  <button
                    type="button"
                    disabled={busy || blocks.length >= 50}
                    onClick={() => handleAddBlock('paragraph')}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    + Đoạn văn
                  </button>
                  <button
                    type="button"
                    disabled={busy || blocks.length >= 50}
                    onClick={() => handleAddBlock('image')}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    + Hình ảnh
                  </button>
                </div>
              </div>

              {blocks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                  Chưa có khối nội dung nào. Hãy bấm{' '}
                  <strong>+ Tiêu đề đoạn</strong>, <strong>+ Đoạn văn</strong>{' '}
                  hoặc <strong>+ Hình ảnh</strong> ở trên.
                </div>
              ) : (
                <div className="space-y-3">
                  {blocks.map((blk, idx) => (
                    <div
                      key={blk.localId}
                      className="space-y-2.5 rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 dark:border-gray-700 dark:bg-gray-800/50"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          Khối #{idx + 1} — {blockTypeLabels[blk.type]}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {blk.type === 'heading' && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                handleChangeBlockType(blk.localId, 'paragraph')
                              }
                              title="Chuyển khối này thành Đoạn văn bản (giữ nguyên văn bản)"
                              className="rounded-lg border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
                            >
                              ⇄ Chuyển thành Đoạn văn
                            </button>
                          )}
                          {blk.type === 'paragraph' && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                handleChangeBlockType(blk.localId, 'heading')
                              }
                              title="Chuyển khối này thành Tiêu đề đoạn (giữ nguyên văn bản)"
                              className="rounded-lg border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
                            >
                              ⇄ Chuyển thành Tiêu đề
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busy || idx === 0}
                            onClick={() => handleMoveBlock(idx, -1)}
                            aria-label={`Di chuyển khối ${idx + 1} lên`}
                            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                          >
                            ↑ Lên
                          </button>
                          <button
                            type="button"
                            disabled={busy || idx === blocks.length - 1}
                            onClick={() => handleMoveBlock(idx, 1)}
                            aria-label={`Di chuyển khối ${idx + 1} xuống`}
                            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                          >
                            ↓ Xuống
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRemoveBlock(blk.localId)}
                            aria-label={`Xóa khối ${idx + 1}`}
                            className="rounded-lg border border-error-200 bg-white px-2.5 py-1 text-xs font-semibold text-error-600 hover:bg-error-50 dark:bg-gray-800"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>

                      {blk.type === 'heading' && (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={blk.text}
                            disabled={busy}
                            onChange={(e) =>
                              handleUpdateBlock(blk.localId, {
                                text: e.target.value,
                              })
                            }
                            placeholder="Nhập tiêu đề đoạn (tối đa 160 ký tự)..."
                            className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold bg-white dark:bg-gray-800 ${
                              blk.text.length > 160
                                ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                                : 'border-gray-300 dark:border-gray-700'
                            }`}
                          />
                          <div className="flex items-center justify-between text-[11px]">
                            {blk.text.length > 160 ? (
                              <span className="font-semibold text-error-600">
                                ⚠️ Vượt quá {blk.text.length - 160} ký tự (tối đa 160). Hãy rút gọn hoặc bấm &ldquo;⇄ Chuyển thành Đoạn văn&rdquo; ở trên.
                              </span>
                            ) : (
                              <span className="text-gray-400">
                                Tiêu đề đoạn nên ngắn gọn, súc tích
                              </span>
                            )}
                            <span
                              className={`font-mono ${
                                blk.text.length > 160
                                  ? 'font-bold text-error-600'
                                  : 'text-gray-400'
                              }`}
                            >
                              {blk.text.length}/160
                            </span>
                          </div>
                        </div>
                      )}

                      {blk.type === 'paragraph' && (
                        <div>
                          <textarea
                            rows={4}
                            maxLength={4000}
                            value={blk.text}
                            disabled={busy}
                            onChange={(e) =>
                              handleUpdateBlock(blk.localId, {
                                text: e.target.value,
                              })
                            }
                            placeholder="Nhập nội dung đoạn văn bản (thuần văn bản, tối đa 4000 ký tự)..."
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs leading-relaxed dark:border-gray-700 dark:bg-gray-800"
                          />
                        </div>
                      )}

                      {blk.type === 'image' && (
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                              <span>
                                {blk.uploading
                                  ? 'Đang tải ảnh...'
                                  : blk.imageUrl
                                  ? 'Thay ảnh minh họa'
                                  : 'Chọn ảnh minh họa'}
                              </span>
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                disabled={busy || blk.uploading}
                                onChange={(e) =>
                                  void handleUploadBlockImage(blk.localId, e)
                                }
                                className="sr-only"
                              />
                            </label>
                            <span className="text-[11px] text-gray-500">
                              📐 Gợi ý thiết kế: chiều rộng 800 – 1200 px (tỷ lệ 16:9 hoặc 4:3)
                            </span>
                          </div>
                          {blk.imageUrl && (
                            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                                <img
                                  src={blk.imageUrl}
                                  alt={blk.alt || `Ảnh khối ${idx + 1}`}
                                  className="h-24 w-full object-cover"
                                />
                              </div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Chú thích / Mô tả ảnh (Alt)
                                <input
                                  type="text"
                                  maxLength={300}
                                  value={blk.alt}
                                  disabled={busy}
                                  onChange={(e) =>
                                    handleUpdateBlock(blk.localId, {
                                      alt: e.target.value,
                                    })
                                  }
                                  placeholder="Mô tả hình ảnh..."
                                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional CTA Button */}
            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
              <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={ctaEnabled}
                  disabled={busy}
                  onChange={(e) => {
                    setCtaEnabled(e.target.checked);
                    setDirty(true);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600"
                />
                <span>
                  Hiển thị nút hành động (CTA) ở cuối bài viết trên ứng dụng
                </span>
              </label>

              {ctaEnabled && (
                <div className="grid gap-3 pt-1 sm:grid-cols-2">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Nhãn nút hành động (tối đa 80 ký tự)
                    <input
                      type="text"
                      maxLength={80}
                      value={ctaLabel}
                      disabled={busy}
                      onChange={(e) => {
                        setCtaLabel(e.target.value);
                        setDirty(true);
                      }}
                      placeholder="Ví dụ: Đặt ngay / Khám phá thực đơn"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                    />
                  </label>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Màn hình đích trong ứng dụng
                    <select
                      value={ctaRouteKey}
                      disabled={busy}
                      onChange={(e) => {
                        setCtaRouteKey(e.target.value);
                        setDirty(true);
                      }}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                    >
                      {ARTICLE_CTA_ROUTE_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          </section>

          {/* Phone-frame Live Preview (360px) */}
          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Xem trước bài viết (Mobile)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Mô phỏng màn hình đọc bài viết trên ứng dụng khách hàng.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  360px
                </span>
              </div>

              <div className="mx-auto max-w-[360px] overflow-hidden rounded-[2rem] border-[7px] border-gray-900 bg-white shadow-xl">
                <div className="max-h-[700px] overflow-y-auto bg-[#FAF8F5] text-gray-900">
                  <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200/80 bg-white/95 px-3.5 py-2.5 backdrop-blur">
                    <span className="text-sm font-bold text-gray-700">←</span>
                    <span className="truncate text-xs font-bold text-gray-900">
                      {title.trim() || 'Bài viết thương hiệu'}
                    </span>
                  </div>

                  {coverImageUrl && (
                    <div className="w-full bg-gray-100">
                      <img
                        src={coverImageUrl}
                        alt={coverAlt || title || 'Ảnh bìa'}
                        className="h-auto w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="space-y-3.5 p-4">
                    <h1 className="text-lg font-extrabold leading-snug text-gray-900">
                      {title.trim() || 'Tiêu đề bài viết sẽ hiển thị tại đây'}
                    </h1>

                    {blocks.map((blk) => {
                      if (blk.type === 'heading') {
                        return (
                          <h2
                            key={blk.localId}
                            className="pt-1 text-sm font-bold leading-snug text-gray-900"
                          >
                            {blk.text || 'Tiêu đề đoạn...'}
                          </h2>
                        );
                      }
                      if (blk.type === 'image') {
                        return (
                          <figure key={blk.localId} className="space-y-1">
                            {blk.imageUrl ? (
                              <img
                                src={blk.imageUrl}
                                alt={blk.alt || 'Ảnh minh họa'}
                                className="h-auto w-full rounded-xl object-contain"
                              />
                            ) : (
                              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-100 text-xs text-gray-400">
                                Chưa chọn ảnh minh họa
                              </div>
                            )}
                            {blk.alt && (
                              <figcaption className="text-center text-[11px] text-gray-500">
                                {blk.alt}
                              </figcaption>
                            )}
                          </figure>
                        );
                      }
                      return (
                        <p
                          key={blk.localId}
                          className="whitespace-pre-line text-xs leading-relaxed text-gray-700"
                        >
                          {blk.text || 'Nội dung đoạn văn...'}
                        </p>
                      );
                    })}

                    {ctaEnabled && ctaLabel.trim() && (
                      <div className="pt-3">
                        <div className="w-full rounded-xl bg-brand-600 py-2.5 text-center text-xs font-bold text-white shadow-sm">
                          {ctaLabel.trim()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
