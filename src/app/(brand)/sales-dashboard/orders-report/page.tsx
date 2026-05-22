'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  getOrdersReport,
  OrdersReportData,
} from '@/services/salesDashboard';
import { TaskIcon, TimeIcon, DollarLineIcon, GroupIcon } from '@/icons';
import DashboardFilters from '../components/DashboardFilters';
import ExportExcelButton from '../components/ExportExcelButton';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import {
  buildScopeHeaderRows,
  exportSheetsToExcel,
} from '../utils/excelExport';

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const formatNumber = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

export default function OrdersReportPage() {
  const filters = useDashboardFilters(7);
  const {
    stores, storesLoading,
    selectedStoreId, setSelectedStoreId,
    fromDate, toDate, setDateRange,
    resolveBrandId,
  } = filters;

  const [data, setData] = useState<OrdersReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storesLoading) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, fromDate, toDate, storesLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const brandIdToUse = resolveBrandId();
      if (!selectedStoreId && !brandIdToUse) {
        setData(null);
        setLoading(false);
        return;
      }
      const res = await getOrdersReport(
        selectedStoreId ? Number(selectedStoreId) : null,
        !selectedStoreId ? brandIdToUse : null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
      );
      setData(res?.data ?? null);
    } catch (err: any) {
      console.error('Failed to fetch orders report:', err);
      toast.error(err.message || 'Không thể tải báo cáo đơn hàng');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const peakHourLabel = useMemo(() => {
    if (!data?.hourlyDistribution?.length) return '—';
    const peak = data.hourlyDistribution.reduce((max, cur) =>
      cur.invoiceCount > max.invoiceCount ? cur : max,
      data.hourlyDistribution[0]);
    return peak.invoiceCount > 0 ? `${peak.hour}:00 - ${peak.hour}:59` : '—';
  }, [data]);

  const maxHourlyRevenue = useMemo(() =>
      data?.hourlyDistribution.reduce((m, h) => Math.max(m, h.revenue), 0) ?? 0,
    [data]);

  const handleExport = () => {
    if (!data) return;
    const storeName =
      stores.find((s) => (s.id || s.storeId) === selectedStoreId)?.name ||
      stores.find((s) => (s.id || s.storeId) === selectedStoreId)?.storeName ||
      undefined;

    const summaryRows = [
      { 'Chỉ số': 'Tổng số bill', 'Giá trị': data.totalInvoices },
      { 'Chỉ số': 'Tổng doanh thu (VND)', 'Giá trị': data.totalRevenue },
      { 'Chỉ số': 'Tổng số ly/món', 'Giá trị': data.totalItems },
      { 'Chỉ số': 'AOV (VND)', 'Giá trị': data.averageOrderValue },
      { 'Chỉ số': 'Số ly/món/bill', 'Giá trị': data.averageItemsPerOrder },
      { 'Chỉ số': 'Đơn hủy sau chế biến', 'Giá trị': data.cancelledOrders },
      { 'Chỉ số': 'Đơn hủy trước chế biến', 'Giá trị': data.preCancelledOrders },
      { 'Chỉ số': 'Tỷ lệ hủy (%)', 'Giá trị': data.cancelRate },
    ];

    const hourlyRows = data.hourlyDistribution.map((h) => ({
      Giờ: `${h.hour}:00`,
      'Số bill': h.invoiceCount,
      'Số ly/món': h.itemCount,
      'Doanh thu (VND)': h.revenue,
    }));

    const dailyRows = data.dailyTrend.map((d) => ({
      Ngày: new Date(d.date).toLocaleDateString('vi-VN'),
      'Số bill': d.invoiceCount,
      'Số ly/món': d.itemCount,
      'Doanh thu (VND)': d.revenue,
      'AOV (VND)': d.invoiceCount > 0 ? Math.round(d.revenue / d.invoiceCount) : 0,
    }));

    exportSheetsToExcel('BC2_DonHang', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({
          reportName: 'BC#2 Báo cáo đơn hàng',
          storeName,
          fromDate,
          toDate,
        }),
        columnWidths: [22, 30],
      },
      { name: 'Tóm tắt', rows: summaryRows, columnWidths: [28, 18] },
      { name: 'Theo khung giờ', rows: hourlyRows, columnWidths: [10, 12, 14, 18] },
      { name: 'Theo ngày', rows: dailyRows, columnWidths: [14, 12, 14, 18, 16] },
    ]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Báo Cáo Đơn Hàng
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            BC#2 — AOV, items per bill, tỷ lệ hủy, phân bổ theo khung giờ
          </p>
        </div>
        <ExportExcelButton onClick={handleExport} disabled={loading || !data} />
      </div>

      <DashboardFilters
        stores={stores}
        storesLoading={storesLoading}
        selectedStoreId={selectedStoreId}
        fromDate={fromDate}
        toDate={toDate}
        onStoreChange={setSelectedStoreId}
        onDateRangeChange={setDateRange}
        datePickerId="orders-report-date-range"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          ))}
          <div className="md:col-span-4 h-80 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
        </div>
      ) : !data ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={<TaskIcon className="w-5 h-5" />}
                     label="Tổng số bill"
                     value={formatNumber(data.totalInvoices)}
                     accent="indigo" />
            <KpiCard icon={<DollarLineIcon className="w-5 h-5" />}
                     label="AOV (Trung bình bill)"
                     value={formatVND(data.averageOrderValue)}
                     accent="emerald" />
            <KpiCard icon={<GroupIcon className="w-5 h-5" />}
                     label="Số ly/món/bill"
                     value={data.averageItemsPerOrder.toFixed(2)}
                     subValue={`Tổng ${formatNumber(data.totalItems)} ly/món`}
                     accent="amber" />
            <KpiCard icon={<TimeIcon className="w-5 h-5" />}
                     label="Khung giờ cao điểm"
                     value={peakHourLabel}
                     subValue={`Tỷ lệ hủy: ${data.cancelRate.toFixed(2)}%`}
                     accent="rose" />
          </div>

          {/* Cancel breakdown */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Tình trạng hủy đơn</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <CancelStat label="Hoàn tất" value={data.totalInvoices} color="text-emerald-600" />
              <CancelStat label="Hủy trước chế biến" value={data.preCancelledOrders} color="text-amber-600" />
              <CancelStat label="Hủy sau chế biến" value={data.cancelledOrders} color="text-rose-600" />
            </div>
          </div>

          {/* Hourly distribution */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Doanh thu theo khung giờ</h2>
              <span className="text-xs text-gray-400">
                Doanh thu cao nhất: {formatVND(maxHourlyRevenue)}
              </span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-end h-48">
              {data.hourlyDistribution.map((h) => {
                const ratio = maxHourlyRevenue > 0 ? (h.revenue / maxHourlyRevenue) * 100 : 0;
                return (
                  <div key={h.hour} className="flex flex-col items-center justify-end gap-1 group">
                    <div className="text-[10px] text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                      {h.invoiceCount > 0 ? h.invoiceCount : ''}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-brand-500 to-indigo-500 rounded-t-md transition-all duration-300"
                      style={{ height: `${Math.max(ratio, h.revenue > 0 ? 4 : 0)}%` }}
                      title={`${h.hour}h — ${formatVND(h.revenue)} (${h.invoiceCount} bill)`}
                    />
                    <div className="text-[10px] text-gray-500">{h.hour}h</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily trend table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Doanh thu theo ngày</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wider">Ngày</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Bill</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Số ly/món</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Doanh thu</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">AOV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.dailyTrend.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Không có dữ liệu trong khoảng đã chọn.
                      </td>
                    </tr>
                  ) : (
                    data.dailyTrend.map((d) => (
                      <tr key={d.date}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                        <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-200">
                          {new Date(d.date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                          {formatNumber(d.invoiceCount)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                          {formatNumber(d.itemCount)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatVND(d.revenue)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                          {d.invoiceCount > 0
                            ? formatVND(Math.round(d.revenue / d.invoiceCount))
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, subValue, accent }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  accent: 'emerald' | 'indigo' | 'amber' | 'rose';
}) {
  const accentMap = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
  } as const;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentMap[accent]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      {subValue && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subValue}</div>}
    </div>
  );
}

function CancelStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800/60">
      <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{formatNumber(value)}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm text-center">
      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
        <TaskIcon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Không có dữ liệu</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
        Chưa có hóa đơn hoàn tất trong khoảng thời gian đã chọn.
      </p>
    </div>
  );
}
