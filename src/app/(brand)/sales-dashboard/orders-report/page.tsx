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
          <HourlyChart
            hourlyDistribution={data.hourlyDistribution}
            maxHourlyRevenue={maxHourlyRevenue}
            formatVND={formatVND}
            formatNumber={formatNumber}
          />

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

interface HourlyItem {
  hour: number;
  invoiceCount: number;
  itemCount: number;
  revenue: number;
}

function HourlyChart({ hourlyDistribution, maxHourlyRevenue, formatVND, formatNumber }: {
  hourlyDistribution: HourlyItem[];
  maxHourlyRevenue: number;
  formatVND: (v: number) => string;
  formatNumber: (v: number) => string;
}) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const hoveredData = hoveredHour !== null
    ? hourlyDistribution.find(h => h.hour === hoveredHour) ?? null
    : null;

  const peak = hourlyDistribution.reduce((max, cur) =>
    cur.revenue > max.revenue ? cur : max, hourlyDistribution[0]);
  const totalBills = hourlyDistribution.reduce((s, h) => s + h.invoiceCount, 0);
  const activeHours = hourlyDistribution.filter(h => h.invoiceCount > 0).length;
  const totalRevenue = hourlyDistribution.reduce((s, h) => s + h.revenue, 0);
  const avgRevenuePerHour = activeHours > 0 ? totalRevenue / activeHours : 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold">Doanh thu theo khung giờ</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Tổng doanh thu: {formatVND(totalRevenue)}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-brand-500 to-indigo-500" />
            Doanh thu
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            Cao điểm
          </span>
        </div>
      </div>

      {/* Hover info panel — fixed position below header, above chart */}
      <div className="h-10 mb-2 flex items-center justify-center">
        {hoveredData ? (
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 rounded-xl px-5 py-2 text-sm transition-all duration-150 animate-in fade-in">
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              🕐 {hoveredData.hour}:00 – {hoveredData.hour}:59
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              💰 Doanh thu: {formatVND(hoveredData.revenue)}
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              🧾 {hoveredData.invoiceCount} bill
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              ☕ {hoveredData.itemCount} ly/món
            </span>
          </div>
        ) : (
          <p className="text-xs text-gray-300 dark:text-gray-600 italic">
            Di chuột vào cột để xem chi tiết
          </p>
        )}
      </div>

      {/* Chart area */}
      <div className="relative">
        {/* Y-axis grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ bottom: '28px' }}>
          {[100, 75, 50, 25, 0].map((pct) => (
            <div key={pct} className="flex items-center w-full">
              <span className="text-[10px] text-gray-300 dark:text-gray-600 w-14 text-right pr-2 shrink-0">
                {formatNumber(Math.round((maxHourlyRevenue * pct) / 100))}
              </span>
              <div className="flex-1 border-t border-dashed border-gray-100 dark:border-gray-800" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="ml-16">
          <div className="flex items-end gap-[3px] min-w-[600px]" style={{ height: '220px' }}>
            {hourlyDistribution.map((h) => {
              const ratio = maxHourlyRevenue > 0 ? (h.revenue / maxHourlyRevenue) * 100 : 0;
              const isPeak = h.revenue === maxHourlyRevenue && h.revenue > 0;
              const isHighTraffic = ratio >= 60;
              const isHovered = hoveredHour === h.hour;
              return (
                <div
                  key={h.hour}
                  className="flex-1 flex flex-col items-center justify-end h-full relative min-w-[22px] cursor-pointer"
                  onMouseEnter={() => setHoveredHour(h.hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                >
                  {/* Value label */}
                  <div className={`text-[10px] font-medium text-gray-600 dark:text-gray-300 mb-1 whitespace-nowrap transition-opacity duration-150 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    {h.revenue > 0 ? `${(h.revenue / 1000).toFixed(0)}k` : ''}
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-200
                      ${isPeak
                        ? 'bg-gradient-to-t from-amber-500 to-amber-300 shadow-sm shadow-amber-200/50'
                        : isHighTraffic
                          ? 'bg-gradient-to-t from-brand-600 to-indigo-400'
                          : 'bg-gradient-to-t from-brand-500/80 to-indigo-400/60'}
                      ${isHovered ? 'opacity-100 scale-x-110 shadow-md' : ''}`}
                    style={{ height: `${Math.max(ratio, h.revenue > 0 ? 3 : 0)}%` }}
                  />

                  {/* X-axis label */}
                  <div className={`text-[10px] mt-1.5 font-medium transition-colors
                    ${isPeak ? 'text-amber-600 dark:text-amber-400 font-bold' : isHovered ? 'text-gray-700 dark:text-gray-200 font-semibold' : 'text-gray-400'}`}>
                    {h.hour}h
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="text-center">
          <div className="text-[11px] text-gray-400 uppercase tracking-wider">Giờ cao điểm</div>
          <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">{peak.hour}:00 - {peak.hour}:59</div>
        </div>
        <div className="text-center">
          <div className="text-[11px] text-gray-400 uppercase tracking-wider">DT cao điểm</div>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatVND(peak.revenue)}</div>
        </div>
        <div className="text-center">
          <div className="text-[11px] text-gray-400 uppercase tracking-wider">TB/giờ hoạt động</div>
          <div className="text-sm font-bold text-gray-700 dark:text-gray-200 mt-0.5">{formatVND(Math.round(avgRevenuePerHour))}</div>
        </div>
        <div className="text-center">
          <div className="text-[11px] text-gray-400 uppercase tracking-wider">Giờ có bill</div>
          <div className="text-sm font-bold text-gray-700 dark:text-gray-200 mt-0.5">{activeHours}/24 giờ ({totalBills} bill)</div>
        </div>
      </div>
    </div>
  );
}

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
