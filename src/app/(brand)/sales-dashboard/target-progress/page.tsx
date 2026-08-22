'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { useAuthStore } from '@/store/authStore';
import { getStores, type Store } from '@/services/stores';
import {
  SalesTargetProgressResponse,
  getSalesTargetProgress,
} from '@/services/salesTargets';
import {
  DollarLineIcon,
  PieChartIcon,
  BoxCubeIcon,
  ShootingStarIcon,
  PencilIcon,
  CheckLineIcon,
  CloseLineIcon,
} from '@/icons';

const formatVnd = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(Math.round(value))} ₫`;

const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(Math.round(value));

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const todayStr = new Date().toISOString().split('T')[0];

export default function SalesTargetProgressPage() {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  const [data, setData] = useState<SalesTargetProgressResponse | null>(null);

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

  // Load progress data
  const loadProgress = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSalesTargetProgress({
        year: selectedYear,
        month: selectedMonth,
        storeId: selectedStoreId ? Number(selectedStoreId) : undefined,
      });
      if (res.data) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Failed to load sales target progress:', err);
      toast.error('Không thể tải dữ liệu tiến độ mục tiêu');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedStoreId]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const summary = data?.summary;
  const dailyBreakdown = data?.dailyBreakdown || [];
  const weeklyBreakdown = data?.weeklyBreakdown || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
              Sales Performance & KPI
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            Theo Dõi Tiến Độ Mục Tiêu Kinh Doanh
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Theo dõi chi tiết mức độ hoàn thành chỉ tiêu doanh thu sau giảm, số lượng bill và AOV theo từng ngày và từng tuần trong tháng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/target-settings"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
          >
            <PencilIcon className="size-4 text-brand-500" />
            Cài Đặt Target Tháng
          </Link>
          <button
            onClick={loadProgress}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            Làm Mới
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
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Tất cả cửa hàng (Toàn Brand)</option>
            {(stores || []).map((s) => (
              <option key={s.id || (s as any).storeId} value={s.id || (s as any).storeId}>
                {s.name || (s as any).storeName || `Cửa hàng ${s.id || (s as any).storeId}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tháng:
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Năm:
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
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

      {/* KPI Cards Bento Grid */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Doanh Thu Sau Giảm */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Doanh Thu Sau Giảm
                </span>
                <div className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                  <DollarLineIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatVnd(summary.actualRevenue)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Mục tiêu: {formatVnd(summary.targetRevenue)}</span>
                <span
                  className={`font-semibold ${
                    summary.revenueCompletionRate >= 100
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-brand-600 dark:text-brand-400'
                  }`}
                >
                  {summary.revenueCompletionRate}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    summary.revenueCompletionRate >= 100
                      ? 'bg-green-500'
                      : 'bg-brand-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, summary.revenueCompletionRate))}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 dark:border-gray-800/80">
              {summary.remainingRevenue > 0 ? (
                <span className="text-red-500 font-medium">
                  Còn thiếu: {formatVnd(summary.remainingRevenue)}
                </span>
              ) : (
                <span className="text-green-600 font-semibold">
                  Đã vượt chỉ tiêu: {formatVnd(Math.abs(summary.actualRevenue - summary.targetRevenue))}
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Số Lượng Bill */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Số Lượng Bill
                </span>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <BoxCubeIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatNumber(summary.actualOrderCount)}
                </span>
                <span className="text-xs text-gray-500">bill</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Mục tiêu: {formatNumber(summary.targetOrderCount)} bill</span>
                <span
                  className={`font-semibold ${
                    summary.orderCompletionRate >= 100
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {summary.orderCompletionRate}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    summary.orderCompletionRate >= 100
                      ? 'bg-green-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, summary.orderCompletionRate))}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 dark:border-gray-800/80">
              {summary.remainingOrders > 0 ? (
                <span className="text-amber-500 font-medium">
                  Còn thiếu: {formatNumber(summary.remainingOrders)} bill
                </span>
              ) : (
                <span className="text-green-600 font-semibold">
                  Đã vượt: {formatNumber(Math.abs(summary.actualOrderCount - summary.targetOrderCount))} bill
                </span>
              )}
            </div>
          </div>

          {/* Card 3: AOV Mục Tiêu vs Thực Tế */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Giá Trị TB Đơn (AOV)
                </span>
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <PieChartIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatVnd(summary.actualAov)}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Mục tiêu: {formatVnd(summary.targetAov)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-xs dark:border-gray-800/80">
              {summary.actualAov >= summary.targetAov ? (
                <span className="font-semibold text-green-600">
                  Đạt AOV (+{formatVnd(summary.actualAov - summary.targetAov)})
                </span>
              ) : (
                <span className="font-medium text-amber-500">
                  Thấp hơn MT (-{formatVnd(summary.targetAov - summary.actualAov)})
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Hiệu Suất Đạt Chỉ Tiêu */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Hiệu Suất Ngày / Tuần
                </span>
                <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                  <ShootingStarIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-base font-bold text-green-700 dark:bg-green-950/40 dark:text-green-400">
                  <CheckLineIcon className="size-4" />
                  {summary.achievedDays} Đạt
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-base font-bold text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  <CloseLineIcon className="size-4" />
                  {summary.missedDays} Chưa đạt
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Đã tính {summary.elapsedDays}/{summary.daysInMonth} ngày trong tháng
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-xs font-semibold text-purple-600 dark:border-gray-800/80 dark:text-purple-400">
              Đạt {summary.achievedWeeks}/{summary.totalWeeks} Tuần Mục Tiêu
            </div>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === 'daily'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <span>Chi Tiết Theo Ngày (Daily View)</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {dailyBreakdown.length} ngày
          </span>
        </button>

        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === 'weekly'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <span>Chi Tiết Theo Tuần (Weekly View)</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {weeklyBreakdown.length} tuần
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <SkeletonTable rows={10} columns={8} />
        </div>
      ) : activeTab === 'daily' ? (
        /* DAILY BREAKDOWN TABLE */
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold uppercase text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
                <tr>
                  <th className="px-5 py-3.5">Ngày & Thứ</th>
                  <th className="px-5 py-3.5 text-right">Doanh Thu Sau Giảm</th>
                  <th className="px-5 py-3.5 text-right">Target Ngày</th>
                  <th className="px-5 py-3.5 text-right">Chênh Lệch (+/-)</th>
                  <th className="px-5 py-3.5 text-center">Đánh Giá</th>
                  <th className="px-5 py-3.5 text-right">Số Bill (Thực tế / MT)</th>
                  <th className="px-5 py-3.5 text-right">Lệch Bill</th>
                  <th className="px-5 py-3.5 text-right">AOV Thực Tế</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {dailyBreakdown.map((row) => {
                  const isToday = row.dateStr === todayStr;
                  const isPastOrToday =
                    row.dayNumber <= (summary?.elapsedDays || 0);

                  return (
                    <tr
                      key={row.dayNumber}
                      className={`transition-colors ${
                        isToday
                          ? 'bg-brand-50/40 dark:bg-brand-950/20'
                          : row.isWeekend
                          ? 'bg-gray-50/30 dark:bg-gray-800/20'
                          : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {row.dayNumber < 10
                              ? `0${row.dayNumber}`
                              : row.dayNumber}
                            /{selectedMonth < 10 ? `0${selectedMonth}` : selectedMonth}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                              row.isWeekend
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {row.dayOfWeek}
                          </span>
                          {isToday && (
                            <span className="rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              Hôm nay
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900 dark:text-white">
                        {formatVnd(row.actualRevenue)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-500">
                        {formatVnd(row.targetRevenue)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold">
                        {row.revenueVariance >= 0 ? (
                          <span className="text-green-600 dark:text-green-400">
                            +{formatVnd(row.revenueVariance)}
                          </span>
                        ) : (
                          <span className="text-red-500 dark:text-red-400">
                            -{formatVnd(Math.abs(row.revenueVariance))}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {isPastOrToday ? (
                          row.isRevenueAchieved ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-950/40 dark:text-green-400">
                              <CheckLineIcon className="size-3.5" />
                              ĐẠT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:text-red-400">
                              <CloseLineIcon className="size-3.5" />
                              THIẾU {formatVnd(Math.abs(row.revenueVariance))}
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">Chưa diễn ra</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {row.actualOrderCount}
                        </span>{' '}
                        <span className="text-xs text-gray-400">
                          / {row.targetOrderCount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">
                        {row.orderVariance >= 0 ? (
                          <span className="text-green-600">
                            +{row.orderVariance}
                          </span>
                        ) : (
                          <span className="text-red-500">
                            {row.orderVariance}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-700 dark:text-gray-300">
                        {row.actualAov > 0 ? formatVnd(row.actualAov) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {summary && (
                <tfoot className="border-t-2 border-gray-300 bg-gray-50/90 font-bold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <tr>
                    <td className="px-5 py-4">TỔNG CỘNG THÁNG</td>
                    <td className="px-5 py-4 text-right text-brand-600 dark:text-brand-400">
                      {formatVnd(summary.actualRevenue)}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-600 dark:text-gray-300">
                      {formatVnd(summary.targetRevenue)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {summary.actualRevenue >= summary.targetRevenue ? (
                        <span className="text-green-600">
                          +{formatVnd(summary.actualRevenue - summary.targetRevenue)}
                        </span>
                      ) : (
                        <span className="text-red-500">
                          -{formatVnd(summary.targetRevenue - summary.actualRevenue)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="rounded-full bg-brand-500 px-3 py-1 text-xs text-white">
                        {summary.achievedDays}/{summary.elapsedDays} Ngày Đạt
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {formatNumber(summary.actualOrderCount)} / {formatNumber(summary.targetOrderCount)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {summary.actualOrderCount - summary.targetOrderCount >= 0 ? (
                        <span className="text-green-600">
                          +{summary.actualOrderCount - summary.targetOrderCount}
                        </span>
                      ) : (
                        <span className="text-red-500">
                          {summary.actualOrderCount - summary.targetOrderCount}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {formatVnd(summary.actualAov)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ) : (
        /* WEEKLY BREAKDOWN TABLE */
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold uppercase text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-4">Tuần Trong Tháng</th>
                  <th className="px-6 py-4 text-right">Doanh Thu Sau Giảm</th>
                  <th className="px-6 py-4 text-right">Target Tuần</th>
                  <th className="px-6 py-4 text-right">Chênh Lệch (+/-)</th>
                  <th className="px-6 py-4 text-center">Đánh Giá Tuần</th>
                  <th className="px-6 py-4 text-right">Số Bill (Thực tế / MT)</th>
                  <th className="px-6 py-4 text-right">AOV Tuần</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {weeklyBreakdown.map((row) => (
                  <tr
                    key={row.weekNumber}
                    className="hover:bg-gray-50/50 transition-colors dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {row.weekLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                      {formatVnd(row.actualRevenue)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">
                      {formatVnd(row.targetRevenue)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {row.revenueVariance >= 0 ? (
                        <span className="text-green-600 dark:text-green-400">
                          +{formatVnd(row.revenueVariance)}
                        </span>
                      ) : (
                        <span className="text-red-500 dark:text-red-400">
                          -{formatVnd(Math.abs(row.revenueVariance))}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.isRevenueAchieved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-950/40 dark:text-green-400">
                          <CheckLineIcon className="size-4" />
                          ĐẠT CHỈ TIÊU
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:text-red-400">
                          <CloseLineIcon className="size-4" />
                          THIẾU {formatVnd(Math.abs(row.revenueVariance))}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatNumber(row.actualOrderCount)}
                      </span>{' '}
                      <span className="text-xs text-gray-400">
                        / {formatNumber(row.targetOrderCount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-700 dark:text-gray-300">
                      {row.actualAov > 0 ? formatVnd(row.actualAov) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
