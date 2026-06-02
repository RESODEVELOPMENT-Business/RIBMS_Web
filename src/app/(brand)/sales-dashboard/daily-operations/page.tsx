'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getDailyOperationsReport,
  DailyOperationsReportData,
} from '@/services/salesDashboard';
import { DollarLineIcon, PieChartIcon, BoxCubeIcon } from '@/icons';
import DashboardFilters from '../components/DashboardFilters';
import ExportExcelButton from '../components/ExportExcelButton';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import {
  buildScopeHeaderRows,
  exportSheetsToExcel,
} from '../utils/excelExport';

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const formatNumber = (v: number) => new Intl.NumberFormat('vi-VN').format(v || 0);
// Compact cell number (no currency symbol) for the dense daily grid.
const formatCell = (v: number) => (v ? new Intl.NumberFormat('vi-VN').format(Math.round(v)) : '');
const formatDate = (iso: string) => {
  const d = new Date(iso);
  const dd = `${d.getDate()}`.padStart(2, '0');
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

function KpiCard({
  label,
  value,
  hint,
  icon,
  accent = 'brand',
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  accent?: 'brand' | 'green' | 'red' | 'amber';
}) {
  const accentMap: Record<string, string> = {
    brand: 'text-brand-600 dark:text-brand-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-extrabold ${accentMap[accent]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</div>}
    </div>
  );
}

export default function DailyOperationsReportPage() {
  const {
    stores,
    storesLoading,
    selectedStoreId,
    setSelectedStoreId,
    fromDate,
    toDate,
    setDateRange,
    resolveBrandId,
  } = useDashboardFilters();

  const [data, setData] = useState<DailyOperationsReportData | null>(null);
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
      const res = await getDailyOperationsReport(
        selectedStoreId ? Number(selectedStoreId) : null,
        !selectedStoreId ? brandIdToUse : null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
      );
      setData(res?.data ?? null);
    } catch (err: any) {
      console.error('Failed to fetch daily operations report:', err);
      toast.error(err.message || 'Không thể tải báo cáo vận hành theo ngày');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;
    const storeName =
      stores.find((s) => (s.id || s.storeId) === selectedStoreId)?.name ||
      stores.find((s) => (s.id || s.storeId) === selectedStoreId)?.storeName ||
      undefined;

    const summaryRows = [
      { 'Chỉ số': 'Doanh thu gộp', 'Giá trị (VND)': data.grossSales },
      { 'Chỉ số': 'Tổng giảm giá', 'Giá trị (VND)': data.totalDiscount },
      { 'Chỉ số': 'Tổng DT sau giảm giá', 'Giá trị (VND)': data.netSales },
      { 'Chỉ số': 'Tổng số bill (TC)', 'Giá trị (VND)': data.totalBills },
      { 'Chỉ số': 'Trung bình / bill (TA)', 'Giá trị (VND)': data.averageBill },
      { 'Chỉ số': 'Lợi nhuận đến hiện tại (tháng)', 'Giá trị (VND)': data.profitToDate },
      { 'Chỉ số': 'Lợi nhuận dự kiến trong tháng', 'Giá trị (VND)': data.projectedMonthlyProfit },
    ] as Record<string, any>[];

    const dailyRows = data.rows.map((r) => {
      const base: Record<string, any> = {
        Thứ: r.dayLabel,
        Ngày: formatDate(r.date),
        '6h-10h': r.slot6To10,
        '10h-14h': r.slot10To14,
        '14h-18h': r.slot14To18,
        '18h-22h': r.slot18To22,
      };
      data.paymentTypes.forEach((pt, i) => {
        base[pt.name] = r.paymentAmounts[i] ?? 0;
      });
      base['Giảm giá'] = r.discount;
      base['Tổng DT sau giảm giá'] = r.netSales;
      base['TC'] = r.billCount;
      base['TA'] = r.averageBill;
      return base;
    });

    exportSheetsToExcel('BaoCao_VanHanhTheoNgay', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({
          reportName: 'Báo cáo vận hành theo ngày',
          storeName,
          fromDate,
          toDate,
        }),
      },
      { name: 'Tóm tắt', rows: summaryRows },
      { name: 'Theo ngày', rows: dailyRows },
    ]);
  };

  const slotHeaderCls =
    'px-3 py-2 text-right font-bold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap';
  const cellCls = 'px-3 py-2 text-right tabular-nums whitespace-nowrap';

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Báo Cáo Vận Hành Theo Ngày
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Doanh thu theo khung giờ &amp; phương thức thanh toán, số bill (TC) và trung bình/bill (TA) mỗi ngày
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
        datePickerId="daily-operations-date-range"
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
            ))}
          </div>
          <div className="h-96 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
        </div>
      ) : !data ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          Chọn cửa hàng và khoảng thời gian để xem báo cáo vận hành.
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Doanh thu gộp"
              value={formatVND(data.grossSales)}
              hint={`Sau giảm giá: ${formatVND(data.netSales)}`}
              icon={<DollarLineIcon className="w-4 h-4" />}
            />
            <KpiCard
              label="Lợi nhuận đến hiện tại"
              value={formatVND(data.profitToDate)}
              hint="Theo tháng hiện tại"
              icon={<DollarLineIcon className="w-4 h-4" />}
              accent={data.profitToDate >= 0 ? 'green' : 'red'}
            />
            <KpiCard
              label="Lợi nhuận dự kiến trong tháng"
              value={formatVND(data.projectedMonthlyProfit)}
              hint="Dự kiến cuối tháng"
              icon={<PieChartIcon className="w-4 h-4" />}
              accent={data.projectedMonthlyProfit >= 0 ? 'green' : 'red'}
            />
            <KpiCard
              label="Tổng bill (TC)"
              value={formatNumber(data.totalBills)}
              hint={`TB/bill (TA): ${formatVND(data.averageBill)}`}
              icon={<BoxCubeIcon className="w-4 h-4" />}
              accent="amber"
            />
          </div>

          {/* Daily table */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  {/* Grand totals row */}
                  <tr className="bg-amber-50 dark:bg-amber-950/20 text-gray-700 dark:text-gray-200">
                    <th className="px-3 py-2 text-left font-bold" colSpan={2}>
                      Tổng kỳ
                    </th>
                    <th className={cellCls}>{formatCell(data.slot6To10)}</th>
                    <th className={cellCls}>{formatCell(data.slot10To14)}</th>
                    <th className={cellCls}>{formatCell(data.slot14To18)}</th>
                    <th className={cellCls}>{formatCell(data.slot18To22)}</th>
                    {data.paymentTypes.map((pt) => (
                      <th key={pt.paymentTypeId} className={cellCls}>
                        {formatCell(pt.total)}
                      </th>
                    ))}
                    <th className={cellCls}>{formatCell(data.totalDiscount)}</th>
                    <th className={`${cellCls} font-extrabold`}>{formatCell(data.netSales)}</th>
                    <th className={cellCls}>{formatNumber(data.totalBills)}</th>
                    <th className={cellCls}>{formatCell(data.averageBill)}</th>
                  </tr>
                  {/* Column headers */}
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700">
                    <th className="px-3 py-2 text-left font-bold text-gray-500 dark:text-gray-400 uppercase">Thứ</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Ngày</th>
                    <th className={slotHeaderCls}>6h-10h</th>
                    <th className={slotHeaderCls}>10h-14h</th>
                    <th className={slotHeaderCls}>14h-18h</th>
                    <th className={slotHeaderCls}>18h-22h</th>
                    {data.paymentTypes.map((pt) => (
                      <th key={pt.paymentTypeId} className={slotHeaderCls}>
                        {pt.name}
                      </th>
                    ))}
                    <th className={slotHeaderCls}>Giảm giá</th>
                    <th className={slotHeaderCls}>Tổng DT</th>
                    <th className={slotHeaderCls}>TC</th>
                    <th className={slotHeaderCls}>TA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.rows.map((r) => {
                    const isWeekend = r.dayOfWeek === 6 || r.dayOfWeek === 7;
                    return (
                      <tr
                        key={r.date}
                        className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30"
                      >
                        <td className={`px-3 py-2 font-semibold ${isWeekend ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-gray-200'}`}>
                          {r.dayLabel}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">{formatDate(r.date)}</td>
                        <td className={cellCls}>{formatCell(r.slot6To10)}</td>
                        <td className={cellCls}>{formatCell(r.slot10To14)}</td>
                        <td className={cellCls}>{formatCell(r.slot14To18)}</td>
                        <td className={cellCls}>{formatCell(r.slot18To22)}</td>
                        {data.paymentTypes.map((pt, i) => (
                          <td key={pt.paymentTypeId} className={cellCls}>
                            {formatCell(r.paymentAmounts[i] ?? 0)}
                          </td>
                        ))}
                        <td className={`${cellCls} text-rose-600 dark:text-rose-400`}>{formatCell(r.discount)}</td>
                        <td className={`${cellCls} font-bold`}>{formatCell(r.netSales)}</td>
                        <td className={cellCls}>{r.billCount || ''}</td>
                        <td className={cellCls}>{formatCell(r.averageBill)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Cột khung giờ tính doanh thu thuần theo giờ tạo đơn (đơn ngoài 6h–22h vẫn nằm trong Tổng DT &amp; TC nhưng
              không vào cột khung giờ). Cột thanh toán = tổng tiền theo từng phương thức của thương hiệu.
              2 chỉ số lợi nhuận tính theo tháng hiện tại.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
