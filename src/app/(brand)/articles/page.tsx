'use client';
/* eslint-disable @next/next/no-img-element -- admin preview renders signed storage URLs */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  deleteBrandArticle,
  getBrandArticles,
  type BrandArticleListItem,
} from '@/services/brandArticles';
import {
  ArticleConflictBanner,
  ArticleStatusBadge,
  ConflictState,
  extractArticleApiError,
  formatDateTime,
} from './_components/articleShared';

export default function BrandArticlesPage() {
  const user = useAuthStore((state) => state.user);

  const [articles, setArticles] = useState<BrandArticleListItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingList, setLoadingList] = useState(true);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState<ConflictState | null>(null);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setError('');
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
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const deletedId = params.get('deleted');
    if (!deletedId) return;

    setMessage(`Đã xóa bài viết #${deletedId} thành công.`);
    params.delete('deleted');
    const cleanQuery = params.toString();
    const nextUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
  }, []);

  if (user?.role === 'Administrator') return null;
  if (user?.role && user.role !== 'BrandManager') {
    return (
      <div className="p-6 text-error-600">
        Bạn không có quyền quản lý Bài viết thương hiệu.
      </div>
    );
  }

  const handleDeleteArticle = async (targetId: number, targetTitle?: string) => {
    if (deletingId !== null) return;
    if (
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function'
    ) {
      const ok = window.confirm(
        `Bạn có chắc muốn xóa vĩnh viễn bài viết "${targetTitle || 'này'}" (#${targetId})?\n\nHành động này không thể hoàn tác. Nếu bài viết đang được gắn trên Trang chủ, hệ thống sẽ chặn thao tác xóa và hiển thị vị trí cần gỡ trước.`,
      );
      if (!ok) return;
    }

    setDeletingId(targetId);
    setMessage('');
    setError('');
    setConflict(null);

    try {
      await deleteBrandArticle(targetId);
      setMessage(`Đã xóa bài viết #${targetId} thành công.`);
      await loadList();
    } catch (err) {
      const parsed = extractArticleApiError(err, 'Không thể xóa bài viết.');
      if (parsed.conflict) {
        setConflict(parsed.conflict);
      } else {
        setError(parsed.errorMessage || 'Không thể xóa bài viết.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const isBusy = deletingId !== null;

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
          <Link
            href="/articles/create"
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
          >
            + Tạo bài viết mới
          </Link>
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

      <ArticleConflictBanner conflict={conflict} />

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
                {articles.map((item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
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
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            URL công khai: /bai-viet/{item.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <ArticleStatusBadge
                        status={item.status}
                        hasUnpublishedChanges={item.hasUnpublishedChanges}
                      />
                    </td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                      {formatDateTime(item.publishedAt)}
                    </td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                      {formatDateTime(item.updatedAt)}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Link
                          href={`/articles/${item.id}/edit`}
                          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                          Chỉnh sửa
                        </Link>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void handleDeleteArticle(item.id, item.title)
                          }
                          aria-label={`Xóa bài viết #${item.id}`}
                          title="Xóa bài viết"
                          className="inline-flex items-center rounded-lg border border-error-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-error-600 transition hover:bg-error-50 disabled:opacity-50 dark:border-error-500/30 dark:bg-gray-800 dark:text-error-400"
                        >
                          {deletingId === item.id ? 'Đang xóa...' : 'Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
