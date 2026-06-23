'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getProfitForecast, ProfitForecastData } from '@/services/salesDashboard';
import { DollarLineIcon, PieChartIcon, BoxCubeIcon } from '@/icons';
import ExportExcelButton from '../components/ExportExcelButton';
import { useStoreDashboardFilters } from '../hooks/useStoreDashboardFilters';
import { buildScopeHeaderRows, exportSheetsToExcel } from '../utils/excelExport';

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const formatNumber = (v: number) => new Intl.NumberFormat('vi-VN').format(v || 0);

function KpiCard({ label, value, hint, icon, accent = 'brand' }: {
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

export default function StoreProfitForecastPage() {
  const { storeId, fromDate, toDate } = useStoreDashboardFilters();
  const [data, setData] = useState<ProfitForecastData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storeId) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const fetchData = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await getProfitForecast(storeId, null);
      setData(res?.data ?? null);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải báo cáo tình hình lợi nhuận');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;
    const summaryRows = [
      { 'Chỉ số': 'Doanh thu thuần (tháng đến hiện tại)', 'Giá trị (VND)': data.monthToDateNetSales },
      { 'Chỉ số': 'Số ngày đã qua', 'Giá trị': data.elapsedDays },
      { 'Chỉ số': 'Sale trung bình / ngày', 'Giá trị (VND)': data.avgSalesPerDay },
      { 'Chỉ số': 'COGS thực tế (tháng đến hiện tại)', 'Giá trị (VND)': data.monthToDateCogs },
      { 'Chỉ số': 'Chi phí vận hành (trừ NVL)', 'Giá trị (VND)': data.monthToDateOperatingCost },
      { 'Chỉ số': 'Lợi nhuận đến hiện tại', 'Giá trị (VND)': data.profitToDate },
      { 'Chỉ số': 'Doanh số dự kiến (tháng)', 'Giá trị (VND)': data.projectedMonthlySales },
      { 'Chỉ số': 'Tổng chi phí dự kiến (tháng)', 'Giá trị (VND)': data.projectedCostMonthly },
      { 'Chỉ số': 'Lợi nhuận dự kiến (tháng)', 'Giá trị (VND)': data.projectedProfitMonthly },
    ] as Record<string, any>[];

    const costRows = data.costBreakdown.map((c) => ({
      'Loại chi phí': c.categoryName,
      'Số mục': c.costCount,
      'Thực tế tháng (VND)': c.total,
      'Tỷ trọng (%)': c.sharePercent,
      Marketing: c.isMarketing ? 'X' : '',
    }));

    exportSheetsToExcel('TinhHinhLoiNhuan_CuaHang', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({ reportName: 'Báo cáo tình hình lợi nhuận (Cửa hàng)', fromDate, toDate }),
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
            Số liệu luôn theo <strong>tháng hiện tại</strong>: lợi nhuận đến hiện tại + dự kiến cuối tháng từ sale trung bình/ngày
          </p>
        </div>
        <ExportExcelButton onClick={handleExport} disabled={loading || !data} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : !data ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          Không tìm thấy thông tin cửa hàng hoặc chưa có dữ liệu tháng này.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-brand-200 dark:border-brand-800/50 bg-brand-50 dark:bg-brand-950/20 px-5 py-3 text-sm text-brand-700 dark:text-brand-300">
            Kỳ tính: <strong>tháng {new Date(data.asOfDate).getMonth() + 1}/{new Date(data.asOfDate).getFullYear()}</strong>
            {' '}— đã qua <strong>{data.elapsedDays}</strong> / {data.daysInMonth} ngày.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Sale trung bình / ngày"
              value={formatVND(data.avgSalesPerDay)}
              hint={`Từ ${formatVND(data.monthToDateNetSales)} trong ${data.elapsedDays} ngày`}
              icon={<DollarLineIcon className="w-4 h-4" />}
            />
            <KpiCard
              label="Lợi nhuận đến hiện tại"
              value={formatVND(data.profitToDate)}
              hint={`DT ${formatVND(data.monthToDateNetSales)} − COGS ${formatVND(data.monthToDateCogs)} − CP ${formatVND(data.monthToDateOperatingCost)}`}
              icon={<DollarLineIcon className="w-4 h-4" />}
              accent={data.profitToDate >= 0 ? 'green' : 'red'}
            />
            <KpiCard
              label="COGS thực tế (tháng)"
              value={formatVND(data.monthToDateCogs)}
              hint={`Tỷ lệ COGS/doanh thu ~ ${data.cogsRatioPercent}%`}
              icon={<PieChartIcon className="w-4 h-4" />}
              accent="amber"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Doanh số dự kiến (tháng)"
              value={formatVND(data.projectedMonthlySales)}
              hint={`× ${data.daysInMonth} ngày • tuần ~ ${formatVND(data.projectedWeeklySales)}`}
              icon={<PieChartIcon className="w-4 h-4" />}
            />
            <KpiCard
              label="Tổng chi phí dự kiến (tháng)"
              value={formatVND(data.projectedCostMonthly)}
              hint={`NVL ${Math.round(data.materialCostRate * 100)}% ${formatVND(data.projectedMaterialCost)} + VH ${formatVND(data.projectedOperatingCost)}`}
              icon={<BoxCubeIcon className="w-4 h-4" />}
              accent="amber"
            />
            <KpiCard
              label="Lợi nhuận dự kiến (tháng)"
              value={formatVND(data.projectedProfitMonthly)}
              hint={`Tuần ~ ${formatVND(data.projectedProfitWeekly)}`}
              accent={data.projectedProfitMonthly >= 0 ? 'green' : 'red'}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 text-sm text-gray-600 dark:text-gray-300">
            <strong>Lợi nhuận đến hiện tại</strong> = doanh thu thuần − giá vốn (COGS) thực tế − chi phí vận hành (đã loại Nguyên vật liệu để tránh tính trùng với COGS).{' '}
            Phần <strong>dự kiến cuối tháng</strong> giả định chi phí NVL ={' '}
            <span className="font-semibold">{Math.round(data.materialCostRate * 100)}%</span> doanh số dự kiến,
            chi phí vận hành khác được scale theo số ngày lên cả tháng.
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h2 className="text-lg font-semibold mb-4">Chi phí vận hành tháng này theo danh mục (đã loại NVL)</h2>
            {data.costBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Chưa cấu hình chi phí. Vào trang chi tiết cửa hàng để nhập chi phí hàng tháng.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                      <th className="py-2 pr-2">Loại chi phí</th>
                      <th className="py-2 pr-2 text-right">Số mục</th>
                      <th className="py-2 pr-2 text-right">Thực tế tháng</th>
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
