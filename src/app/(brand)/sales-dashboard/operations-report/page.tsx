'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getOperationsReport,
  OperationsReportData,
} from '@/services/salesDashboard';
import { TimeIcon, BoltIcon, GridIcon, CheckCircleIcon } from '@/icons';
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

export default function OperationsReportPage() {
  const filters = useDashboardFilters(7);
  const {
    stores, storesLoading,
    selectedStoreId, setSelectedStoreId,
    fromDate, toDate, setDateRange,
    resolveBrandId,
  } = filters;

  const [data, setData] = useState<OperationsReportData | null>(null);
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
      const res = await getOperationsReport(
        selectedStoreId ? Number(selectedStoreId) : null,
        !selectedStoreId ? brandIdToUse : null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
      );
      setData(res?.data ?? null);
    } catch (err: any) {
      console.error('Failed to fetch operations report:', err);
      toast.error(err.message || 'Không thể tải báo cáo vận hành');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const showStorePerformance = !selectedStoreId && data && data.storePerformance.length > 1;

  const handleExport = () => {
    if (!data) return;
    const storeName =
      stores.find((s) => (s.id || s.storeId) === selectedStoreId)?.name ||
      stores.find((s) => (s.id || s.storeId) === selectedStoreId)?.storeName ||
      undefined;

    const summaryRows = [
      { 'Chỉ số': 'Số ngày trong khoảng', 'Giá trị': data.totalDaysInRange },
      { 'Chỉ số': 'Bill / giờ TB', 'Giá trị': data.averageInvoicesPerHour },
      { 'Chỉ số': 'Ly/món / giờ TB', 'Giá trị': data.averageItemsPerHour },
      { 'Chỉ số': 'Thời gian xử lý TB (phút)', 'Giá trị': data.averageProcessingMinutes },
      { 'Chỉ số': 'Khung giờ cao điểm', 'Giá trị': `${data.peakHour}:00` },
      { 'Chỉ số': 'Số bill cao điểm', 'Giá trị': data.peakHourInvoices },
    ];

    const shiftRows = data.shiftPerformance.map((s) => ({
      Mã: s.shiftCode,
      'Ca': s.shiftName,
      'Số bill': s.invoiceCount,
      'Số ly/món': s.itemCount,
      'Doanh thu (VND)': s.revenue,
      'AOV (VND)': s.averageOrderValue,
      'Tỷ trọng (%)': s.sharePercent,
    }));

    const storeRows = data.storePerformance.map((s, idx) => ({
      STT: idx + 1,
      'Cửa hàng': s.storeName,
      'Số bill': s.invoiceCount,
      'Số ly/món': s.itemCount,
      'Doanh thu (VND)': s.revenue,
      'AOV (VND)': s.averageOrderValue,
      'Bill/giờ': s.averageInvoicesPerHour,
      'Xử lý TB (phút)': s.averageProcessingMinutes,
      'Peak (giờ)': s.peakHour,
    }));

    exportSheetsToExcel('BC5_VanHanh', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({
          reportName: 'BC#5 Báo cáo vận hành',
          storeName,
          fromDate,
          toDate,
        }),
        columnWidths: [22, 30],
      },
      { name: 'Tóm tắt', rows: summaryRows, columnWidths: [28, 18] },
      { name: 'Theo ca', rows: shiftRows, columnWidths: [12, 22, 12, 14, 18, 14, 14] },
      { name: 'Theo cửa hàng', rows: storeRows, columnWidths: [6, 30, 12, 14, 18, 14, 12, 16, 12] },
    ]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Báo Cáo Vận Hành Cửa Hàng
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            BC#5 — Bill / giờ, peak hour, năng suất theo ca và theo cửa hàng
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
        datePickerId="operations-report-date-range"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          ))}
          <div className="md:col-span-4 h-72 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
        </div>
      ) : !data ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={<BoltIcon className="w-5 h-5" />}
                     label="Bill / giờ TB"
                     value={data.averageInvoicesPerHour.toFixed(2)}
                     subValue={`${formatNumber(data.totalDaysInRange)} ngày`}
                     accent="emerald" />
            <KpiCard icon={<GridIcon className="w-5 h-5" />}
                     label="Ly/món / giờ TB"
                     value={data.averageItemsPerHour.toFixed(2)}
                     accent="indigo" />
            <KpiCard icon={<TimeIcon className="w-5 h-5" />}
                     label="Thời gian xử lý TB"
                     value={`${data.averageProcessingMinutes.toFixed(1)} phút`}
                     subValue="từ check-in → hoàn tất"
                     accent="amber" />
            <KpiCard icon={<CheckCircleIcon className="w-5 h-5" />}
                     label="Khung giờ cao điểm"
                     value={`${data.peakHour}:00 - ${data.peakHour}:59`}
                     subValue={`${formatNumber(data.peakHourInvoices)} bill`}
                     accent="rose" />
          </div>

          {/* Shift performance */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Năng suất theo ca</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {data.shiftPerformance.map((s, idx) => {
                const gradients = [
                  'from-amber-500 to-orange-500',
                  'from-emerald-500 to-teal-500',
                  'from-indigo-500 to-blue-500',
                  'from-rose-500 to-pink-500',
                  'from-purple-500 to-violet-500',
                ];
                const g = gradients[idx % gradients.length];
                return (
                  <div key={s.shiftCode}
                       className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/60">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">{s.shiftCode}</div>
                        <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{s.shiftName}</div>
                      </div>
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                        {s.sharePercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatVND(s.revenue)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatNumber(s.invoiceCount)} bill • AOV {formatVND(s.averageOrderValue)}
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden mt-3">
                      <div className={`bg-gradient-to-r ${g} h-full rounded-full transition-all duration-500`}
                           style={{ width: `${s.sharePercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Store performance */}
          {showStorePerformance && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">So sánh hiệu suất giữa các cửa hàng</h2>
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-2.5 text-center font-bold text-gray-500 uppercase tracking-wider w-12">#</th>
                      <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wider">Cửa hàng</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Bill</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Ly/món</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Doanh thu</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">AOV</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Bill/giờ</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Xử lý TB (phút)</th>
                      <th className="px-4 py-2.5 text-center font-bold text-gray-500 uppercase tracking-wider">Peak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.storePerformance.map((s, idx) => (
                      <tr key={s.storeId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                        <td className="px-4 py-2.5 text-center text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">
                          {s.storeName}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                          {formatNumber(s.invoiceCount)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                          {formatNumber(s.itemCount)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatVND(s.revenue)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                          {formatVND(s.averageOrderValue)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                          {s.averageInvoicesPerHour.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                          {s.averageProcessingMinutes.toFixed(1)}
                        </td>
                        <td className="px-4 py-2.5 text-center text-brand-600 dark:text-brand-400 font-semibold">
                          {s.peakHour}h
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm text-center">
      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
        <TimeIcon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Không có dữ liệu vận hành</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
        Chưa có hóa đơn hoàn tất trong khoảng đã chọn để tính toán hiệu suất vận hành.
      </p>
    </div>
  );
}
