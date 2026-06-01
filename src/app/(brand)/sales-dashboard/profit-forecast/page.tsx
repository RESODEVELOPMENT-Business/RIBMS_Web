'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getProfitForecast,
  ProfitForecastData,
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

export default function ProfitForecastPage() {
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

  const [data, setData] = useState<ProfitForecastData | null>(null);
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
      const res = await getProfitForecast(
        selectedStoreId ? Number(selectedStoreId) : null,
        !selectedStoreId ? brandIdToUse : null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
      );
      setData(res?.data ?? null);
    } catch (err: any) {
      console.error('Failed to fetch profit forecast:', err);
      toast.error(err.message || 'Không thể tải báo cáo tình hình lợi nhuận');
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
      { 'Chỉ số': 'Doanh thu thuần (kỳ chọn)', 'Giá trị (VND)': data.periodNetSales },
      { 'Chỉ số': 'Số ngày của kỳ', 'Giá trị (VND)': data.periodDays },
      { 'Chỉ số': 'Sale trung bình / ngày', 'Giá trị (VND)': data.avgSalesPerDay },
      { 'Chỉ số': 'Số ngày trong tháng', 'Giá trị (VND)': data.daysInMonth },
      { 'Chỉ số': 'Doanh số dự kiến (tháng)', 'Giá trị (VND)': data.projectedMonthlySales },
      { 'Chỉ số': 'Doanh số dự kiến (tuần)', 'Giá trị (VND)': data.projectedWeeklySales },
      { 'Chỉ số': 'Chi phí cố định (tháng)', 'Giá trị (VND)': data.fixedCostMonthly },
      { 'Chỉ số': 'Chi phí % doanh thu (tháng)', 'Giá trị (VND)': data.percentCostMonthly },
      { 'Chỉ số': 'Tổng chi phí dự kiến (tháng)', 'Giá trị (VND)': data.projectedCostMonthly },
      { 'Chỉ số': 'Giá vốn dự đoán (tham khảo)', 'Giá trị (VND)': data.projectedCogsMonthly },
      { 'Chỉ số': 'Lợi nhuận dự kiến (tháng)', 'Giá trị (VND)': data.projectedProfitMonthly },
      { 'Chỉ số': 'Lợi nhuận dự kiến (tuần)', 'Giá trị (VND)': data.projectedProfitWeekly },
      { 'Chỉ số': 'Chi phí hiện tại', 'Giá trị (VND)': data.currentCostTotal },
      { 'Chỉ số': 'Lợi nhuận đến hiện tại', 'Giá trị (VND)': data.profitToDate },
    ] as Record<string, any>[];

    const costRows = data.costBreakdown.map((c) => ({
      'Loại chi phí': c.categoryName,
      'Số mục': c.costCount,
      'Dự kiến tháng (VND)': c.total,
      'Tỷ trọng (%)': c.sharePercent,
      Marketing: c.isMarketing ? 'X' : '',
    }));

    exportSheetsToExcel('BaoCao_TinhHinhLoiNhuan', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({
          reportName: 'Báo cáo tình hình lợi nhuận (dự đoán)',
          storeName,
          fromDate,
          toDate,
        }),
      },
      { name: 'Tóm tắt', rows: summaryRows },
      { name: 'Chi phí dự kiến', rows: costRows },
    ]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Báo Cáo Tình Hình Lợi Nhuận
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Dự đoán doanh số &amp; lợi nhuận kinh doanh từ sale trung bình/ngày và chi phí cấu hình
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
        datePickerId="profit-forecast-date-range"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : !data ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          Chọn cửa hàng và khoảng thời gian để xem dự đoán lợi nhuận.
        </div>
      ) : (
        <>
          {/* Doanh số dự kiến */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Sale trung bình / ngày"
              value={formatVND(data.avgSalesPerDay)}
              hint={`Từ ${formatVND(data.periodNetSales)} trong ${data.periodDays} ngày`}
              icon={<DollarLineIcon className="w-4 h-4" />}
            />
            <KpiCard
              label="Doanh số dự kiến (tháng)"
              value={formatVND(data.projectedMonthlySales)}
              hint={`× ${data.daysInMonth} ngày trong tháng`}
              icon={<PieChartIcon className="w-4 h-4" />}
            />
            <KpiCard
              label="Doanh số dự kiến (tuần)"
              value={formatVND(data.projectedWeeklySales)}
              hint="× 7 ngày"
              icon={<PieChartIcon className="w-4 h-4" />}
            />
          </div>

          {/* Chi phí & lợi nhuận */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Tổng chi phí dự kiến (tháng)"
              value={formatVND(data.projectedCostMonthly)}
              hint={`Cố định ${formatVND(data.fixedCostMonthly)} + % ${formatVND(data.percentCostMonthly)}`}
              icon={<BoxCubeIcon className="w-4 h-4" />}
              accent="amber"
            />
            <KpiCard
              label="Lợi nhuận dự kiến (tháng)"
              value={formatVND(data.projectedProfitMonthly)}
              hint={`Tuần ~ ${formatVND(data.projectedProfitWeekly)}`}
              accent={data.projectedProfitMonthly >= 0 ? 'green' : 'red'}
            />
            <KpiCard
              label="Lợi nhuận đến hiện tại"
              value={formatVND(data.profitToDate)}
              hint={`Chi phí hiện tại ${formatVND(data.currentCostTotal)}`}
              accent={data.profitToDate >= 0 ? 'green' : 'red'}
            />
          </div>

          {/* Giá vốn tham khảo */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 text-sm text-gray-600 dark:text-gray-300">
            Giá vốn (COGS) dự đoán tham khảo:{' '}
            <span className="font-semibold">{formatVND(data.projectedCogsMonthly)}</span>{' '}
            (tỷ lệ COGS/doanh thu kỳ ~ {data.cogsRatioPercent}%). Lưu ý: nếu đã khai báo chi phí
            "NVL %", giá vốn này chỉ để đối chiếu, không cộng vào tổng chi phí.
          </div>

          {/* Bảng breakdown chi phí */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h2 className="text-lg font-semibold mb-4">Chi phí dự kiến theo danh mục</h2>
            {data.costBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chưa cấu hình chi phí. Vào trang chi tiết cửa hàng để nhập chi phí hàng tháng.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                      <th className="py-2 pr-2">Loại chi phí</th>
                      <th className="py-2 pr-2 text-right">Số mục</th>
                      <th className="py-2 pr-2 text-right">Dự kiến tháng</th>
                      <th className="py-2 pr-2 text-right">Tỷ trọng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.costBreakdown.map((c) => (
                      <tr key={c.categoryId} className="border-b dark:border-gray-700">
                        <td className="py-2 pr-2">
                          {c.categoryName}
                          {c.isMarketing && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-pink-100 text-pink-700">MKT</span>
                          )}
                        </td>
                        <td className="py-2 pr-2 text-right">{formatNumber(c.costCount)}</td>
                        <td className="py-2 pr-2 text-right">{formatVND(c.total)}</td>
                        <td className="py-2 pr-2 text-right">{c.sharePercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
