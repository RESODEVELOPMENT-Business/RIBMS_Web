'use client';

import React from 'react';
import Link from 'next/link';
import type {
  BrandArticleBlockType,
  BrandArticleLiveReference,
  BrandArticleStatus,
} from '@/services/brandArticles';

export type ConflictState = {
  kind: 'etag' | 'liveReferences';
  message: string;
  latestServerEtag?: string;
  liveReferences?: BrandArticleLiveReference[];
};

export const statusLabels: Record<string, { label: string; className: string }> =
  {
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

export const blockTypeLabels: Record<BrandArticleBlockType, string> = {
  heading: 'Tiêu đề đoạn (Heading)',
  paragraph: 'Đoạn văn (Paragraph)',
  image: 'Hình ảnh (Image)',
};

export function formatDateTime(iso?: string | null): string {
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

export function extractArticleApiError(
  err: unknown,
  fallbackMsg: string,
): { conflict?: ConflictState; errorMessage?: string } {
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
      return {
        conflict: {
          kind: 'liveReferences',
          message: msg,
          liveReferences: liveRefs,
        },
      };
    }
    const rawConflict = anyErr?.data?.data;
    const latestServerEtag =
      rawConflict?.etag || rawConflict?.eTag || rawConflict?.ETag;
    return {
      conflict: {
        kind: 'etag',
        message: msg,
        latestServerEtag,
      },
    };
  }

  return { errorMessage: msg };
}

export function ArticleStatusBadge({
  status,
  hasUnpublishedChanges,
}: {
  status: BrandArticleStatus;
  hasUnpublishedChanges: boolean;
}) {
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
}

export function ArticleConflictBanner({
  conflict,
  busy,
  canReloadServer,
  onReloadServer,
}: {
  conflict: ConflictState | null;
  busy?: boolean;
  canReloadServer?: boolean;
  onReloadServer?: () => void;
}) {
  if (!conflict) return null;

  if (conflict.kind === 'etag') {
    return (
      <div
        role="alert"
        className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
      >
        <div>
          <p className="font-bold">
            Phát hiện xung đột phiên bản (409 Conflict)
          </p>
          <p className="mt-0.5 text-xs">
            {conflict.message} Nội dung bạn đang nhập trên màn hình vẫn được giữ
            nguyên để tránh mất dữ liệu.
          </p>
        </div>
        {canReloadServer && onReloadServer && (
          <button
            type="button"
            disabled={busy}
            onClick={onReloadServer}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
          >
            Tải lại bản trên server
          </button>
        )}
      </div>
    );
  }

  return (
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
  );
}
