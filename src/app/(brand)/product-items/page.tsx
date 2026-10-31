'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getBrandProductItems, syncHangHoaMaterials } from '@/services/materialReports';
import { BrandProductItem } from '@/types/materialReport';
import { formatCurrency } from '@/utils/currency';

export default function ProductItemListPage() {
  const [data, setData] = useState<BrandProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const activeParam = activeFilter === 'all' ? undefined : activeFilter === 'active';
      const res = await getBrandProductItems(page, pageSize, debouncedSearch, activeParam);

      if (res && res.data) {
        if (Array.isArray(res.data)) {
          setData(res.data);
          setTotalItems(res.data.length);
          setTotalPages(1);
        } else if (res.data.items && Array.isArray(res.data.items)) {
          setData(res.data.items);
          setTotalItems(res.data.total ?? res.data.items.length);
          setTotalPages(res.data.totalPages ?? 1);
        } else {
          setData([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch product items:', err);
      toast.error(err?.message || 'Không thể tải danh sách vật tư');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, activeFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSyncHangHoa = async () => {
    setSyncing(true);
    try {
      const res = await syncHangHoaMaterials();
      toast.success(res?.message || 'Đã đồng bộ danh mục vật tư từ HangHoa thành công!');
      void fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi đồng bộ từ HangHoa');
    } finally {
      setSyncing(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const activeCount = data.filter((d) => d.isAvailable !== false).length;
    const categories = new Set(data.map((d) => d.categoryName).filter(Boolean));
    return {
      activeCount,
      categoryCount: categories.size,
    };
  }, [data]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Vật Tư & Nguyên Liệu (HangHoa)
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Danh mục nguyên vật liệu được đồng bộ trực tiếp từ hệ thống HangHoa dùng để cấu hình định lượng BOM
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sales-dashboard/material-consumption-report"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            📊 Báo cáo tiêu hao & BOM
          </Link>

          <button
            type="button"
            onClick={handleSyncHangHoa}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition shadow-sm disabled:opacity-50"
          >
            <span className={syncing ? 'animate-spin' : ''}>🔄</span>
            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ từ HangHoa'}
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Tổng số vật tư</span>
            <span className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              🏷️
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {totalItems.toLocaleString('vi-VN')} <span className="text-xs font-normal text-gray-400">loại</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Gồm nguyên liệu pha chế, bao bì, đóng gói</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Đang hoạt động trên trang</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              ✅
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.activeCount} <span className="text-xs font-normal text-gray-400">vật tư khả dụng</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Sẵn sàng để đưa vào công thức định lượng</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Nhóm danh mục phân loại</span>
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              📂
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {stats.categoryCount} <span className="text-xs font-normal text-gray-400">nhóm</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Phân loại theo cấu trúc kho HangHoa</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Tìm theo mã hoặc tên vật tư..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Trạng thái:</span>
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setActiveFilter('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => { setActiveFilter('active'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeFilter === 'active'
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Đang dùng
            </button>
            <button
              type="button"
              onClick={() => { setActiveFilter('inactive'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeFilter === 'inactive'
                  ? 'bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Tạm ngưng
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-500">
            <div className="inline-block animate-spin text-2xl mb-2">⏳</div>
            <div>Đang tải danh sách vật tư từ HangHoa...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-500">
            <div className="text-3xl mb-2">📦</div>
            <div className="font-semibold text-gray-700 dark:text-gray-300">Không tìm thấy vật tư nào</div>
            <div className="text-xs text-gray-400 mt-1">
              {searchTerm ? 'Hãy thử tìm kiếm với từ khóa khác' : 'Nhấn nút "Đồng bộ từ HangHoa" để tải danh mục vật tư'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/75 dark:bg-gray-800/50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="py-3 px-4">Mã VT</th>
                  <th className="py-3 px-4">Tên Vật Tư</th>
                  <th className="py-3 px-4">Nhóm Danh Mục</th>
                  <th className="py-3 px-4 text-center">Đơn Vị Lớn</th>
                  <th className="py-3 px-4 text-center">Đơn Vị Lẻ</th>
                  <th className="py-3 px-4 text-center">Tỷ Lệ Quy Đổi</th>
                  <th className="py-3 px-4 text-right">Giá Vốn / Đơn Giá</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.map((item) => {
                  const rate = item.unitRate && item.unitRate > 0 ? item.unitRate : 1;
                  const unitText = item.unit || '—';
                  const unit2Text = item.unit2 || '—';

                  return (
                    <tr
                      key={item.itemId}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {item.itemCode || `VT-${item.itemId}`}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                        {item.itemName}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400">
                        {item.categoryName ? (
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                            {item.categoryName}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Unit (Big) */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                          {unitText}
                        </span>
                      </td>

                      {/* Unit2 (Small) */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                          {unit2Text}
                        </span>
                      </td>

                      {/* Rate */}
                      <td className="py-3.5 px-4 text-center font-medium text-gray-700 dark:text-gray-300">
                        {item.unit && item.unit2 && item.unit !== item.unit2 ? (
                          <span className="text-[11px] text-gray-600 dark:text-gray-400 font-mono">
                            1 {unitText} = <strong className="text-gray-900 dark:text-white">{rate.toLocaleString('vi-VN')}</strong> {unit2Text}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">1 : 1</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-gray-800 dark:text-gray-200">
                        {item.price && item.price > 0 ? (
                          formatCurrency(item.price)
                        ) : (
                          <span className="text-gray-400">0 ₫</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {item.isAvailable !== false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            Tạm ngưng
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs font-medium outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>trên tổng số <strong>{totalItems.toLocaleString('vi-VN')}</strong> vật tư</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                ◀ Trước
              </button>

              <span className="px-3 py-1 font-semibold text-gray-700 dark:text-gray-300">
                Trang {page} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Sau ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

