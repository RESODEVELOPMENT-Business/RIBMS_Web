'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  getSalesDashboard,
  SalesDashboardData,
  TrendGranularity,
} from '@/services/salesDashboard';
import {
  DollarLineIcon,
  TaskIcon,
  PieChartIcon,
} from '@/icons';
import DashboardFilters from './components/DashboardFilters';
import TrendGranularitySelector from './components/TrendGranularitySelector';
import TrendChart from './components/TrendChart';
import ExportExcelButton from './components/ExportExcelButton';
import { useDashboardFilters } from './hooks/useDashboardFilters';
import {
  buildScopeHeaderRows,
  exportSheetsToExcel,
} from './utils/excelExport';

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function SalesDashboardPage() {
  const filters = useDashboardFilters();
  const {
    stores, storesLoading,
    selectedStoreIds, setSelectedStoreIds,
    fromDate, toDate, setDateRange,
    resolveBrandId,
  } = filters;

  const [dashboardData, setDashboardData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [trendGranularity, setTrendGranularity] = useState<TrendGranularity>('Day');

  useEffect(() => {
    if (!storesLoading) {
      void fetchDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreIds, fromDate, toDate, storesLoading, trendGranularity]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const brandIdToUse = resolveBrandId();
      if (selectedStoreIds.length === 0 && !brandIdToUse) {
        setDashboardData(null);
        setLoading(false);
        return;
      }
      const res = await getSalesDashboard(
        null,
        selectedStoreIds.length === 0 ? brandIdToUse : null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
        undefined,
        trendGranularity,
        selectedStoreIds.length > 0 ? selectedStoreIds : null,
      );
      setDashboardData(res?.data ?? null);
    } catch (err: any) {
      console.error('Failed to fetch sales dashboard:', err);
      toast.error(err.message || 'Không thể tải dữ liệu báo cáo doanh thu');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const totalPaymentSum = useMemo(() => {
    if (!dashboardData?.paymentMethodRevenues) return 0;
    return dashboardData.paymentMethodRevenues.reduce((acc, c) => acc + c.amount, 0);
  }, [dashboardData]);

  const handleExport = () => {
    if (!dashboardData) return;
    const storeName =
      selectedStoreIds.length > 0
        ? selectedStoreIds
          .map((id) => {
            const s = stores.find((st) => (st.id || st.storeId) === id);
            return s?.name || s?.storeName;
          })
          .filter(Boolean)
          .join(', ')
        : undefined;

    const summaryRows = [
      { 'Chỉ số': 'Doanh thu trước giảm giá', 'Giá trị (VND)': dashboardData.revenue.totalAmountBeforeDiscount },
      { 'Chỉ số': 'Giảm giá Passio100/Promotion', 'Giá trị (VND)': dashboardData.revenue.promotionDiscount },
      { 'Chỉ số': 'Giảm giá bán hàng', 'Giá trị (VND)': dashboardData.revenue.salesDiscount },
      { 'Chỉ số': 'Tổng giảm giá', 'Giá trị (VND)': dashboardData.revenue.totalDiscount },
      { 'Chỉ số': 'Doanh thu thực tế', 'Giá trị (VND)': dashboardData.revenue.actualRevenue },
      { 'Chỉ số': 'Tổng số hóa đơn', 'Giá trị': dashboardData.invoices.total },
      { 'Chỉ số': 'Tại quán', 'Giá trị': dashboardData.invoices.atStore },
      { 'Chỉ số': 'Mang đi', 'Giá trị': dashboardData.invoices.takeAway },
      { 'Chỉ số': 'Giao hàng', 'Giá trị': dashboardData.invoices.delivery },
    ] as Record<string, any>[];

    const paymentRows = dashboardData.paymentMethodRevenues.map((pm) => ({
      'Phương thức': pm.paymentTypeName,
      'Số giao dịch': pm.transactionCount,
      'Tổng tiền (VND)': pm.amount,
      'Tỷ lệ (%)': totalPaymentSum > 0 ? Number(((pm.amount / totalPaymentSum) * 100).toFixed(2)) : 0,
    }));

    const sheets: any[] = [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({
          reportName: 'BC#1 Tổng quan doanh thu',
          storeName,
          fromDate,
          toDate,
        }),
      },
      { name: 'Chi tiết doanh thu', rows: summaryRows },
      { name: 'Phương thức thanh toán', rows: paymentRows },
    ];

    if (dashboardData.trend) {
      sheets.push({
        name: `Trend - ${dashboardData.trend.granularity}`,
        rows: dashboardData.trend.buckets.map((b) => ({
          Kỳ: b.label,
          'Số bill': b.invoiceCount,
          'Số ly/món': b.itemCount,
          'Doanh thu (VND)': b.revenue,
        })),
      });
    }

    if (dashboardData.districtRevenues && dashboardData.districtRevenues.length > 0) {
      sheets.push({
        name: 'Theo khu vực',
        rows: dashboardData.districtRevenues.map((d, idx) => ({
          STT: idx + 1,
          'Khu vực / Quận': d.district,
          'Số cửa hàng': d.storeCount,
          'Số bill': d.invoiceCount,
          'Doanh thu (VND)': d.revenue,
          'Tỷ trọng (%)': d.sharePercent,
        })),
      });
    }

    exportSheetsToExcel('BC1_TongQuan', sheets);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Báo Cáo Doanh Thu Bán Hàng
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            BC#1 — Tổng quan doanh thu, hóa đơn và phương thức thanh toán
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportExcelButton onClick={handleExport} disabled={loading || !dashboardData} />
        </div>
      </div>

      <DashboardFilters
        stores={stores}
        storesLoading={storesLoading}
        selectedStoreIds={selectedStoreIds}
        fromDate={fromDate}
        toDate={toDate}
        onStoreIdsChange={setSelectedStoreIds}
        onDateRangeChange={setDateRange}
        datePickerId="dashboard-date-range"
        multiSelect
      />

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TrendGranularitySelector value={trendGranularity} onChange={setTrendGranularity} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          <div className="lg:col-span-2 h-80 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
        </div>
      ) : !dashboardData ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
            <DollarLineIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Không có dữ liệu hiển thị</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
            Vui lòng chọn cửa hàng và khoảng thời gian hợp lệ để hiển thị thống kê báo cáo doanh thu.
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section: Revenue */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/30 dark:shadow-none p-6 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <DollarLineIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Tổng doanh thu bán hàng</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800/80">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Doanh thu trước giảm giá</span>
                    <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {formatVND(dashboardData.revenue.totalAmountBeforeDiscount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800/80">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Tổng giảm giá</span>
                    <span className="text-lg font-bold text-red-500 dark:text-red-400">
                      -{formatVND(dashboardData.revenue.totalDiscount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Doanh thu thực tế</span>
                    <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatVND(dashboardData.revenue.actualRevenue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Invoices */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/30 dark:shadow-none p-6 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <TaskIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Tổng số hóa đơn bán hàng</h2>
                  </div>
                </div>

                <div className="space-y-1 mb-6 border-b border-gray-100 dark:border-gray-800/80 pb-6">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Tổng số hóa đơn
                  </span>
                  <div className="text-4xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400 drop-shadow-sm">
                    {dashboardData.invoices.total.toLocaleString('vi-VN')}
                  </div>
                </div>

                <InvoiceBar label="Tại quán (1)"
                  count={dashboardData.invoices.atStore}
                  total={dashboardData.invoices.total}
                  color="bg-indigo-500" />
                <InvoiceBar label="Mang đi (2)"
                  count={dashboardData.invoices.takeAway}
                  total={dashboardData.invoices.total}
                  color="bg-purple-500" />
                <InvoiceBar label="Giao hàng (3)"
                  count={dashboardData.invoices.delivery}
                  total={dashboardData.invoices.total}
                  color="bg-sky-500" />
              </div>
            </div>
          </div>

          {/* Payment methods */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/30 dark:shadow-none p-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <PieChartIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    Tổng doanh thu theo phương thức thanh toán
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Phân phối nguồn tiền thực tế đổ về hệ thống
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 dark:text-gray-500">Cộng gộp tổng thanh toán</p>
                <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
                  {formatVND(totalPaymentSum)}
                </p>
              </div>
            </div>

            {dashboardData.paymentMethodRevenues.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Không ghi nhận giao dịch thanh toán nào trong kỳ.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {dashboardData.paymentMethodRevenues.map((pm, idx) => {
                    const percent = totalPaymentSum > 0 ? (pm.amount / totalPaymentSum) * 100 : 0;
                    const gradients = [
                      'from-emerald-500 to-teal-500',
                      'from-indigo-500 to-blue-500',
                      'from-amber-500 to-orange-500',
                      'from-rose-500 to-pink-500',
                      'from-purple-500 to-violet-500',
                    ];
                    const gradient = gradients[idx % gradients.length];
                    return (
                      <div key={pm.paymentType}
                        className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/60 flex flex-col justify-between hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-sm font-bold text-gray-800 dark:text-white block">
                              {pm.paymentTypeName}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {pm.transactionCount} giao dịch
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-800 dark:text-white block">
                              {formatVND(pm.amount)}
                            </span>
                            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                              {percent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                          <div className={`bg-gradient-to-r ${gradient} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Trend chart */}
          {dashboardData.trend && dashboardData.trend.buckets.length > 0 && (
            <TrendChart
              buckets={dashboardData.trend.buckets}
              granularity={dashboardData.trend.granularity}
            />
          )}

          {/* District revenues — only when viewing brand-wide */}
          {dashboardData.districtRevenues && dashboardData.districtRevenues.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">Doanh thu theo khu vực / quận</h2>
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-2.5 text-center font-bold text-gray-500 uppercase w-12">#</th>
                      <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase">Quận / Khu vực</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Số CH</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Số bill</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Doanh thu</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Tỷ trọng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {dashboardData.districtRevenues.map((d, idx) => (
                      <tr key={d.district} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                        <td className="px-4 py-2.5 text-center text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">{d.district}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{d.storeCount}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">
                          {d.invoiceCount.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatVND(d.revenue)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-brand-600 dark:text-brand-400 font-semibold">
                          {d.sharePercent.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-semibold ${danger ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
        {value}
      </span>
    </div>
  );
}

function InvoiceBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1 mb-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
        <span className="font-semibold text-gray-800 dark:text-gray-200">{count} hóa đơn</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}


