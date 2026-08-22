'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { useAuthStore } from '@/store/authStore';
import { getStores, type Store } from '@/services/stores';
import {
  SalesTarget,
  SalesTargetPayload,
  getSalesTargets,
  createOrUpdateSalesTarget,
  deleteSalesTarget,
} from '@/services/salesTargets';
import { PencilIcon, TrashBinIcon, PlusIcon, PieChartIcon } from '@/icons';

const formatVnd = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(Math.round(value))} ₫`;

const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(Math.round(value));

interface TargetFormState {
  id?: number;
  storeId: string;
  year: number;
  month: number;
  targetRevenue: string;
  targetOrderCount: string;
  targetAov: string;
  weekendMultiplier: string;
  notes: string;
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const defaultFormState: TargetFormState = {
  storeId: '',
  year: currentYear,
  month: currentMonth,
  targetRevenue: '150000000',
  targetOrderCount: '1500',
  targetAov: '100000',
  weekendMultiplier: '1.0',
  notes: '',
};

export default function TargetSettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // Filter State
  const [filterStoreId, setFilterStoreId] = useState<string>('');
  const [filterYear, setFilterYear] = useState<number>(currentYear);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<TargetFormState>(defaultFormState);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // Load stores
  const loadStores = useCallback(async () => {
    try {
      const brandId = useAuthStore.getState().user?.brandId;
      const res = await getStores(1, 100, brandId ? Number(brandId) : undefined);
      if (res && res.data) {
        const raw = (res.data as any).items || res.data;
        setStores(Array.isArray(raw) ? raw : []);
      } else {
        setStores([]);
      }
    } catch (err) {
      console.error('Failed to load stores:', err);
    }
  }, []);

  // Load targets
  const loadTargets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSalesTargets({
        storeId: filterStoreId ? Number(filterStoreId) : undefined,
        year: filterYear,
      });
      if (res && res.data) {
        const raw = (res.data as any).items || res.data;
        setTargets(Array.isArray(raw) ? raw : []);
      } else {
        setTargets([]);
      }
    } catch (err) {
      console.error('Failed to load sales targets:', err);
      toast.error('Không thể tải danh sách mục tiêu KPI');
    } finally {
      setLoading(false);
    }
  }, [filterStoreId, filterYear]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const handleOpenAddModal = () => {
    setFormState({
      ...defaultFormState,
      year: filterYear,
      storeId: filterStoreId || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (target: SalesTarget) => {
    setFormState({
      id: target.id,
      storeId: target.storeId ? String(target.storeId) : '',
      year: target.year,
      month: target.month,
      targetRevenue: String(target.targetRevenue),
      targetOrderCount: String(target.targetOrderCount),
      targetAov: String(target.targetAov),
      weekendMultiplier: String(target.weekendMultiplier || 1.0),
      notes: target.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleRevenueOrOrderChange = (revStr: string, orderStr: string) => {
    const rev = parseFloat(revStr) || 0;
    const orders = parseInt(orderStr, 10) || 0;
    const autoAov = orders > 0 ? Math.round(rev / orders) : 0;
    setFormState((prev) => ({
      ...prev,
      targetRevenue: revStr,
      targetOrderCount: orderStr,
      targetAov: String(autoAov),
    }));
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const rev = parseFloat(formState.targetRevenue) || 0;
    const orders = parseInt(formState.targetOrderCount, 10) || 0;
    const aov = parseFloat(formState.targetAov) || 0;

    if (rev <= 0 && orders <= 0) {
      toast.error('Vui lòng nhập doanh thu hoặc số lượng bill mục tiêu');
      return;
    }

    try {
      setSaving(true);
      const payload: SalesTargetPayload = {
        storeId: formState.storeId ? Number(formState.storeId) : null,
        year: formState.year,
        month: formState.month,
        targetRevenue: rev,
        targetOrderCount: orders,
        targetAov: aov > 0 ? aov : undefined,
        weekendMultiplier: parseFloat(formState.weekendMultiplier) || 1.0,
        notes: formState.notes.trim() || null,
      };

      const res = await createOrUpdateSalesTarget(payload);
      if (res.status === 200) {
        toast.success('Lưu mục tiêu KPI thành công');
        setIsModalOpen(false);
        loadTargets();
      } else {
        toast.error(res.message || 'Lưu mục tiêu thất bại');
      }
    } catch (err: unknown) {
      console.error('Error saving sales target:', err);
      toast.error('Đã xảy ra lỗi khi lưu mục tiêu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTarget = async (id: number) => {
    try {
      const res = await deleteSalesTarget(id);
      if (res.status === 200) {
        toast.success('Xóa mục tiêu thành công');
        setDeleteTargetId(null);
        loadTargets();
      } else {
        toast.error(res.message || 'Xóa mục tiêu thất bại');
      }
    } catch (err) {
      console.error('Error deleting target:', err);
      toast.error('Đã xảy ra lỗi khi xóa mục tiêu');
    }
  };

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month, 0).getDate();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Thiết Lập Mục Tiêu & KPI Kinh Doanh
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Cấu hình chỉ tiêu Doanh thu sau giảm, Số lượng bill và AOV theo tháng cho từng cửa hàng hoặc toàn bộ thương hiệu.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sales-dashboard/target-progress"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
          >
            <PieChartIcon className="size-4 text-brand-500" />
            Xem Báo Cáo Tiến Độ
          </Link>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <PlusIcon className="size-4" />
            Thiết Lập Target Mới
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Cửa hàng:
          </label>
          <select
            value={filterStoreId}
            onChange={(e) => setFilterStoreId(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Tất cả cửa hàng</option>
            {(stores || []).map((s) => (
              <option key={s.id || (s as any).storeId} value={s.id || (s as any).storeId}>
                {s.name || (s as any).storeName || `Cửa hàng ${s.id || (s as any).storeId}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Năm:
          </label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Targets Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={5} columns={6} />
          </div>
        ) : targets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-brand-50 p-4 dark:bg-brand-950/40">
              <PieChartIcon className="size-8 text-brand-500" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
              Chưa có mục tiêu KPI nào
            </h3>
            <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
              Hãy bấm &quot;Thiết Lập Target Mới&quot; để tạo chỉ tiêu doanh thu và số lượng bill cho tháng này.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600"
            >
              <PlusIcon className="size-4" />
              Thiết Lập Ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold uppercase text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-4">Cửa hàng / Phạm vi</th>
                  <th className="px-6 py-4">Kỳ Mục Tiêu</th>
                  <th className="px-6 py-4 text-right">Target Doanh Thu (Tháng)</th>
                  <th className="px-6 py-4 text-right">Target Ngày (Ước tính)</th>
                  <th className="px-6 py-4 text-right">Target Bill (Tháng / Ngày)</th>
                  <th className="px-6 py-4 text-right">Target AOV</th>
                  <th className="px-6 py-4">Ghi chú</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {targets.map((t) => {
                  const days = daysInMonth(t.year, t.month);
                  const dailyRev = t.targetRevenue / days;
                  const dailyBill = Math.round(t.targetOrderCount / days);

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50/50 transition-colors dark:hover:bg-gray-800/50"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {t.storeName || 'Toàn bộ thương hiệu'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        Tháng {t.month}/{t.year}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-brand-600 dark:text-brand-400">
                        {formatVnd(t.targetRevenue)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-700 dark:text-gray-300">
                        {formatVnd(dailyRev)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatNumber(t.targetOrderCount)}
                        </span>{' '}
                        <span className="text-xs text-gray-500">
                          (~{dailyBill} bill/ngày)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                        {formatVnd(t.targetAov)}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-[160px] truncate">
                        {t.notes || '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(t)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                            title="Chỉnh sửa"
                          >
                            <PencilIcon className="size-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(t.id)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                            title="Xóa"
                          >
                            <TrashBinIcon className="size-4" />
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
      </div>

      {/* Target Modal (Add / Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-xl p-6"
      >
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {formState.id ? 'Chỉnh Sửa Mục Tiêu KPI' : 'Thiết Lập Mục Tiêu KPI Mới'}
          </h3>
        </div>

        <form onSubmit={handleSaveTarget} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Áp Dụng Cho Cửa Hàng
              </label>
              <select
                value={formState.storeId}
                onChange={(e) =>
                  setFormState({ ...formState, storeId: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Toàn bộ thương hiệu</option>
                {(stores || []).map((s) => (
                  <option key={s.id || (s as any).storeId} value={s.id || (s as any).storeId}>
                    {s.name || (s as any).storeName || `Cửa hàng ${s.id || (s as any).storeId}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Tháng
                </label>
                <select
                  value={formState.month}
                  onChange={(e) =>
                    setFormState({ ...formState, month: Number(e.target.value) })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Năm
                </label>
                <select
                  value={formState.year}
                  onChange={(e) =>
                    setFormState({ ...formState, year: Number(e.target.value) })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Doanh Thu Sau Giảm Mục Tiêu (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              required
              value={formState.targetRevenue}
              onChange={(e) =>
                handleRevenueOrOrderChange(e.target.value, formState.targetOrderCount)
              }
              placeholder="VD: 150000000"
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-brand-600 dark:text-brand-400">
              Định dạng: {formatVnd(parseFloat(formState.targetRevenue) || 0)}
              {formState.month && (
                <span className="ml-2 text-gray-500">
                  (~
                  {formatVnd(
                    (parseFloat(formState.targetRevenue) || 0) /
                      daysInMonth(formState.year, formState.month),
                  )}{' '}
                  / ngày)
                </span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Số Lượng Bill Mục Tiêu <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formState.targetOrderCount}
                onChange={(e) =>
                  handleRevenueOrOrderChange(formState.targetRevenue, e.target.value)
                }
                placeholder="VD: 1500"
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500">
                ~
                {Math.round(
                  (parseInt(formState.targetOrderCount, 10) || 0) /
                    daysInMonth(formState.year, formState.month),
                )}{' '}
                bill / ngày
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                AOV Mục Tiêu (VNĐ/Bill)
              </label>
              <input
                type="number"
                min="0"
                value={formState.targetAov}
                onChange={(e) =>
                  setFormState({ ...formState, targetAov: e.target.value })
                }
                placeholder="VD: 35000"
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500">
                Định dạng: {formatVnd(parseFloat(formState.targetAov) || 0)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Ghi Chú
            </label>
            <textarea
              rows={2}
              value={formState.notes}
              onChange={(e) =>
                setFormState({ ...formState, notes: e.target.value })
              }
              placeholder="Ghi chú chiến dịch hoặc kế hoạch kinh doanh..."
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu Mục Tiêu'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        className="max-w-md p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Xác nhận xóa mục tiêu
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Bạn có chắc chắn muốn xóa mục tiêu KPI này không? Thao tác này không thể hoàn tác.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setDeleteTargetId(null)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            Hủy
          </button>
          <button
            onClick={() => deleteTargetId && handleDeleteTarget(deleteTargetId)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Xóa Mục Tiêu
          </button>
        </div>
      </Modal>
    </div>
  );
}
