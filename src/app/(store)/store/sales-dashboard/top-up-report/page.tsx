'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  getTopUpReport,
  TopUpReportData,
  TopUpDailyTrendItem,
} from '@/services/salesDashboard';
import StoreDateFilter from '../components/StoreDateFilter';
import ExportExcelButton from '../components/ExportExcelButton';
import { useStoreDashboardFilters } from '../hooks/useStoreDashboardFilters';
import {
  buildScopeHeaderRows,
  exportSheetsToExcel,
} from '../utils/excelExport';

export default function StoreTopUpReportPage() {
  const { storeId, fromDate, toDate, setDateRange } = useStoreDashboardFilters(6);

  const [report, setReport] = useState<TopUpReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (storeId) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, fromDate, toDate]);

  const fetchData = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await getTopUpReport(storeId, null, fromDate, toDate);
      setReport(res?.data ?? null);
    } catch (err: any) {
      console.error('Failed to fetch top-up report:', err);
      toast.error(err.message || 'Không thể tải báo cáo nạp thẻ');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0);
  const formatDate = (d: string) => {
    try {
      const date = new Date(d);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch { return d; }
  };

  const maxDailyRevenue = useMemo(() => {
    if (!report?.dailyTrend) return 0;
    return Math.max(...report.dailyTrend.map((d) => d.revenue), 1);
  }, [report]);

  const handleExport = () => {
    if (!report) return;

    const summaryRows = [
      { 'Chỉ tiêu': 'Tổng tiền nạp (VND)', 'Giá trị': report.totalTopUpRevenue },
      { 'Chỉ tiêu': 'Số giao dịch nạp', 'Giá trị': report.totalTopUpInvoices },
      { 'Chỉ tiêu': 'Giá trị TB / giao dịch (VND)', 'Giá trị': report.averageTopUpValue },
    ];

    const dailyRows = report.dailyTrend.map((d) => ({
      'Ngày': formatDate(d.date),
      'Doanh thu nạp (VND)': d.revenue,
      'Số giao dịch': d.invoices,
    }));

    const storeRows = report.storeBreakdown.map((s, idx) => ({
      'STT': idx + 1,
      'Cửa hàng': s.storeName,
      'Quận / Huyện': s.districtName ?? '-',
      'Doanh thu nạp (VND)': s.revenue,
      'Số giao dịch': s.invoices,
      'Tỷ trọng (%)': s.sharePercent,
    }));

    exportSheetsToExcel('BaoCaoNapThe', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({
          reportName: 'Báo cáo nạp thẻ thành viên',
          fromDate,
          toDate,
        }),
        columnWidths: [22, 30],
      },
      { name: 'Tổng hợp', rows: summaryRows, columnWidths: [30, 22] },
      { name: 'Theo ngày', rows: dailyRows, columnWidths: [14, 20, 16] },
      { name: 'Theo cửa hàng', rows: storeRows, columnWidths: [6, 30, 20, 20, 14, 14] },
    ]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
            Báo Cáo Nạp Thẻ Thành Viên
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tiền nạp thẻ là tiền tạm giữ, <span className="font-semibold">KHÔNG phải doanh thu</span>
          </p>
        </div>
        <ExportExcelButton onClick={handleExport} disabled={loading || !report} label="Xuất Excel" />
      </div>

      <StoreDateFilter
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={setDateRange}
        datePickerId="store-top-up-report-date-range"
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold animate-pulse">Đang tải dữ liệu...</p>
        </div>
      ) : !report ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-gray-400">Không có dữ liệu nạp thẻ trong khoảng thời gian này.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-amber-50 dark:bg-amber-900/20 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng tiền nạp</span>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatVnd(report.totalTopUpRevenue)}₫</p>
            </div>
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-orange-50 dark:bg-orange-900/20 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Số giao dịch nạp</span>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08" /></svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{report.totalTopUpInvoices}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-yellow-50 dark:bg-yellow-900/20 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Giá trị TB / giao dịch</span>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-white shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" /></svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatVnd(report.averageTopUpValue)}₫</p>
            </div>
          </div>

          {/* Daily Trend Chart */}
          {report.dailyTrend.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/30 dark:shadow-none p-6">
              <h2 className="text-xl font-bold text-amber-700 dark:text-amber-500 mb-4">
                Xu hướng nạp thẻ theo ngày
              </h2>
              <div className="space-y-2">
                {report.dailyTrend.map((d, idx) => (
                  <DailyTrendBar key={idx} item={d} max={maxDailyRevenue} formatVnd={formatVnd} />
                ))}
              </div>
            </div>
          )}

          {/* Store Breakdown Table */}
          {report.storeBreakdown.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/30 dark:shadow-none p-6">
              <h2 className="text-xl font-bold text-amber-700 dark:text-amber-500 mb-4">
                Nạp thẻ theo cửa hàng
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300">
                      <th className="px-3 py-3 text-left font-semibold rounded-l-lg">STT</th>
                      <th className="px-3 py-3 text-left font-semibold">Cửa hàng</th>
                      <th className="px-3 py-3 text-left font-semibold">Quận / Huyện</th>
                      <th className="px-3 py-3 text-right font-semibold">Tiền nạp (₫)</th>
                      <th className="px-3 py-3 text-right font-semibold">Giao dịch</th>
                      <th className="px-3 py-3 text-right font-semibold rounded-r-lg">Tỷ trọng (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.storeBreakdown.map((s, idx) => (
                      <tr key={s.storeId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                        <td className="px-3 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-3 font-semibold">{s.storeName}</td>
                        <td className="px-3 py-3 text-gray-500">{s.districtName ?? '-'}</td>
                        <td className="px-3 py-3 text-right font-mono font-semibold text-amber-700 dark:text-amber-400">{formatVnd(s.revenue)}</td>
                        <td className="px-3 py-3 text-right">{s.invoices}</td>
                        <td className="px-3 py-3 text-right text-gray-500">{s.sharePercent.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-100/50 dark:bg-amber-900/20 font-bold">
                      <td className="px-3 py-3" colSpan={3}>Tổng cộng</td>
                      <td className="px-3 py-3 text-right font-mono text-amber-800 dark:text-amber-300">{formatVnd(report.totalTopUpRevenue)}</td>
                      <td className="px-3 py-3 text-right">{report.totalTopUpInvoices}</td>
                      <td className="px-3 py-3 text-right text-gray-500">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DailyTrendBar({
  item,
  max,
  formatVnd,
}: { item: TopUpDailyTrendItem; max: number; formatVnd: (n: number) => string }) {
  const percent = max > 0 ? (item.revenue / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-12 shrink-0">
        {new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
      </span>
      <div className="flex-1 h-7 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-400 w-28 text-right shrink-0">
        {formatVnd(item.revenue)}₫
      </span>
      <span className="text-xs text-gray-400 w-10 text-right shrink-0">{item.invoices}</span>
    </div>
  );
}