'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getOperationsReport, OperationsReportData } from '@/services/salesDashboard';
import { TimeIcon, BoltIcon, GridIcon, CheckCircleIcon, DollarLineIcon } from '@/icons';
import StoreDateFilter from '../components/StoreDateFilter';
import ExportExcelButton from '../components/ExportExcelButton';
import { useStoreDashboardFilters } from '../hooks/useStoreDashboardFilters';
import { buildScopeHeaderRows, exportSheetsToExcel } from '../utils/excelExport';

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
const formatNumber = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

export default function StoreOperationsReportPage() {
  const { storeId, fromDate, toDate, setDateRange } = useStoreDashboardFilters();
  const [data, setData] = useState<OperationsReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storeId) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, fromDate, toDate]);

  const fetchData = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await getOperationsReport(
        storeId,
        null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
        null,
      );
      setData(res?.data ?? null);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải báo cáo vận hành');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;
    const summaryRows = [
      { 'Chỉ số': 'Bill / giờ TB', 'Giá trị': data.averageInvoicesPerHour },
      { 'Chỉ số': 'Ly/món / giờ TB', 'Giá trị': data.averageItemsPerHour },
      { 'Chỉ số': 'Thời gian xử lý TB (phút)', 'Giá trị': data.averageProcessingMinutes },
      { 'Chỉ số': 'Khung giờ cao điểm', 'Giá trị': `${data.peakHour}:00` },
      { 'Chỉ số': 'Số bill cao điểm', 'Giá trị': data.peakHourInvoices },
    ];

    const shiftRows = data.shiftPerformance.map((s) => ({
      Mã: s.shiftCode,
      Ca: s.shiftName,
      'Số bill': s.invoiceCount,
      'Số ly/món': s.itemCount,
      'Doanh thu (VND)': s.revenue,
      'AOV (VND)': s.averageOrderValue,
      'Xử lý TB (phút)': s.averageProcessingMinutes,
      'Tỷ trọng (%)': s.sharePercent,
    }));

    exportSheetsToExcel('BC5_VanHanh_CuaHang', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({ reportName: 'BC#5 Báo cáo vận hành cửa hàng', fromDate, toDate }),
        columnWidths: [22, 30],
      },
      { name: 'Tóm tắt', rows: summaryRows, columnWidths: [28, 18] },
      { name: 'Theo ca', rows: shiftRows, columnWidths: [12, 22, 12, 14, 18, 14, 16, 14] },
    ]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Vận Hành Cửa Hàng
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            BC#5 — Bill / giờ, peak hour, năng suất theo ca
          </p>
        </div>
        <ExportExcelButton onClick={handleExport} disabled={loading || !data} />
      </div>

      <StoreDateFilter
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={setDateRange}
        datePickerId="store-operations-report-date-range"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={<BoltIcon className="w-5 h-5" />} label="Bill / giờ TB" value={data.averageInvoicesPerHour.toFixed(2)} subValue={`${formatNumber(data.totalDaysInRange)} ngày`} accent="emerald" />
            <KpiCard icon={<GridIcon className="w-5 h-5" />} label="Ly/món / giờ TB" value={data.averageItemsPerHour.toFixed(2)} accent="indigo" />
            <KpiCard icon={<TimeIcon className="w-5 h-5" />} label="Thời gian xử lý TB" value={`${data.averageProcessingMinutes.toFixed(1)} phút`} subValue="từ check-in → hoàn tất" accent="amber" />
            <KpiCard icon={<CheckCircleIcon className="w-5 h-5" />} label="Khung giờ cao điểm" value={`${data.peakHour}:00 - ${data.peakHour}:59`} subValue={`${formatNumber(data.peakHourInvoices)} bill`} accent="rose" />
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Năng suất theo 4 khung giờ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.shiftPerformance.map((s, idx) => {
                const gradients = ['from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500', 'from-indigo-500 to-blue-500', 'from-rose-500 to-pink-500'];
                const g = gradients[idx % gradients.length];
                const timeFrame = s.shiftCode === 'SH01' ? '06h-10h' : s.shiftCode === 'SH02' ? '10h-14h' : s.shiftCode === 'SH03' ? '14h-18h' : '18h-22h';
                return (
                  <div key={s.shiftCode} className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/60">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{s.shiftName}</div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">{timeFrame}</div>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{s.sharePercent.toFixed(1)}%</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{formatVND(s.revenue)}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatNumber(s.invoiceCount)} bill • AOV {formatVND(s.averageOrderValue)}</div>
                    <div className="text-xs text-gray-500 mt-1">Xử lý TB {s.averageProcessingMinutes.toFixed(1)} phút</div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden mt-3">
                      <div className={`bg-gradient-to-r ${g} h-full rounded-full transition-all duration-500`} style={{ width: `${s.sharePercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentMap[accent]}`}>{icon}</div>
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
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">Chưa có hóa đơn hoàn tất trong khoảng đã chọn.</p>
    </div>
  );
}
