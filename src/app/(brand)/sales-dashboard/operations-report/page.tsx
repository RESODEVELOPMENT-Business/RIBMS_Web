'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getOperationsReport,
  OperationsReportData,
} from '@/services/salesDashboard';
import { TimeIcon, BoltIcon, GridIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, DollarLineIcon, TaskIcon } from '@/icons';
import ExportExcelButton from '../components/ExportExcelButton';
import DashboardFilters from '../components/DashboardFilters';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import {
  buildScopeHeaderRows,
  exportSheetsToExcel,
} from '../utils/excelExport';

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
const formatNumber = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

export default function OperationsReportPage() {
  const filters = useDashboardFilters();
  const {
    stores, storesLoading,
    fromDate, toDate, setDateRange,
    resolveBrandId,
  } = filters;

  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const [data, setData] = useState<OperationsReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Disable comparison mode if only 1 store is selected
  useEffect(() => {
    if (selectedStoreIds.length === 1) {
      setIsCompareMode(false);
    }
  }, [selectedStoreIds]);

  useEffect(() => {
    if (!storesLoading) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreIds, fromDate, toDate, storesLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const brandIdToUse = resolveBrandId();
      if (selectedStoreIds.length === 0 && !brandIdToUse) {
        setData(null);
        setLoading(false);
        return;
      }
      const res = await getOperationsReport(
        null,
        selectedStoreIds.length === 0 ? brandIdToUse : null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
        selectedStoreIds.length > 0 ? selectedStoreIds : null,
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

  const showStorePerformance = data && data.storePerformance.length > 1;

  const handleExport = () => {
    if (!data) return;
    let storeName = 'Tất cả cửa hàng (Toàn hệ thống)';
    if (selectedStoreIds.length > 0) {
      const names = selectedStoreIds
        .map((id) => {
          const s = stores.find((st) => (st.id || st.storeId) === id);
          return s?.name || s?.storeName;
        })
        .filter(Boolean);
      storeName = names.join(', ');
    }

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
      'Xử lý TB (phút)': s.averageProcessingMinutes,
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
      { name: 'Theo ca', rows: shiftRows, columnWidths: [12, 22, 12, 14, 18, 14, 16, 14] },
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
        selectedStoreIds={selectedStoreIds}
        fromDate={fromDate}
        toDate={toDate}
        onStoreIdsChange={setSelectedStoreIds}
        onDateRangeChange={setDateRange}
        datePickerId="operations-report-date-range"
        multiSelect={true}
      />

      {/* Sleek Card for Comparison Mode */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Chế độ xem đối chiếu hiệu suất hoạt động
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <label htmlFor="compare-mode-toggle" className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="compare-mode-toggle"
              checked={isCompareMode}
              onChange={(e) => setIsCompareMode(e.target.checked)}
              disabled={selectedStoreIds.length === 1 || (data !== null && data.storePerformance.length < 2)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            <span className="ml-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 select-none">
              Chế độ so sánh đối chiếu
            </span>
          </label>
          {selectedStoreIds.length === 1 && (
            <span className="text-[10px] text-amber-500 font-semibold animate-pulse">
              (Chọn từ 2 cửa hàng hoặc tất cả)
            </span>
          )}
          {data && data.storePerformance.length < 2 && selectedStoreIds.length !== 1 && (
            <span className="text-[10px] text-amber-500 font-semibold animate-pulse">
              (Hệ thống chỉ có 1 cửa hàng, không thể so sánh)
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          ))}
          <div className="md:col-span-4 h-72 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
        </div>
      ) : !data ? (
        <EmptyState />
      ) : isCompareMode ? (
        /* COMPARISON MODE UI */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 1. Revenue Leaderboard */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <DollarLineIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                    So sánh doanh thu và số bill
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full shrink-0">
                  VND
                </span>
              </div>

              <div className="space-y-5">
                {(() => {
                  const sortedStores = [...data.storePerformance].sort((a, b) => b.revenue - a.revenue);
                  const maxRevenue = sortedStores[0]?.revenue || 1;
                  return sortedStores.map((s, idx) => {
                    const ratio = (s.revenue / maxRevenue) * 100;
                    return (
                      <div key={s.storeId} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-extrabold' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                              }`}>
                              {idx + 1}
                            </span>
                            <span className="text-gray-800 dark:text-gray-200">{s.storeName}</span>
                            {idx === 0 && (
                              <span className="text-[9px] bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Doanh thu cao nhất
                              </span>
                            )}
                          </div>
                          <span className="text-gray-900 dark:text-white font-bold">{formatVND(s.revenue)}</span>
                        </div>

                        <div className="w-full bg-gray-50 dark:bg-gray-800/60 rounded-full h-3 relative overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${idx === 0 ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-teal-500'
                              }`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                          <span>{formatNumber(s.invoiceCount)} bill</span>
                          <span>AOV: {formatVND(s.averageOrderValue)}</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* 2. Processing Speed Leaderboard */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <TimeIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                    Tốc độ xử lý trung bình
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 rounded-full shrink-0">
                  phút
                </span>
              </div>

              <div className="space-y-5">
                {(() => {
                  const activeStores = data.storePerformance.filter(s => s.averageProcessingMinutes > 0);
                  const sortedStores = [...activeStores].sort((a, b) => a.averageProcessingMinutes - b.averageProcessingMinutes);
                  const maxTime = Math.max(...data.storePerformance.map(s => s.averageProcessingMinutes), 1);

                  return data.storePerformance.map((s) => {
                    const isFastest = sortedStores[0]?.storeId === s.storeId;
                    const ratio = (s.averageProcessingMinutes / maxTime) * 100;
                    return (
                      <div key={s.storeId} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-800 dark:text-gray-200">{s.storeName}</span>
                            {isFastest && (
                              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Nhanh nhất
                              </span>
                            )}
                          </div>
                          <span className="text-gray-900 dark:text-white font-bold">{s.averageProcessingMinutes.toFixed(1)} phút</span>
                        </div>

                        <div className="w-full bg-gray-50 dark:bg-gray-800/60 rounded-full h-3 relative overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${isFastest ? 'from-emerald-400 to-teal-500' : 'from-indigo-400 to-blue-500'
                              }`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

          </div>

          {/* 3. Productivity & Peak Hours Compare Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <BoltIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                  Năng suất vận hành và khung giờ cao điểm
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                  Mật độ hóa đơn / giờ hoạt động và thời gian khách tập trung đông nhất
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.storePerformance.map((s) => {
                const isMostProductive = s.averageInvoicesPerHour === Math.max(...data.storePerformance.map(x => x.averageInvoicesPerHour));
                return (
                  <div key={s.storeId} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-800/40 space-y-3 relative overflow-hidden">
                    {isMostProductive && (
                      <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                        Hiệu suất cao nhất
                      </div>
                    )}
                    <div className="font-bold text-sm text-gray-800 dark:text-gray-100 pr-12 truncate">{s.storeName}</div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800/40 text-center">
                        <div className="text-[10px] text-gray-400 font-semibold uppercase">Bill / Giờ TB</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                          {s.averageInvoicesPerHour.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800/40 text-center">
                        <div className="text-[10px] text-gray-400 font-semibold uppercase">Giờ cao điểm</div>
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {s.peakHour}h:00
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between border-t border-gray-100 dark:border-gray-800/60 pt-2 mt-1">
                      <span>Tổng ly/món: <strong className="text-gray-700 dark:text-gray-200">{formatNumber(s.itemCount)}</strong></span>
                      <span>AOV: <strong className="text-gray-700 dark:text-gray-200">{formatVND(s.averageOrderValue)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Shift Performance Comparison */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <TimeIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                  So sánh năng suất theo 4 khung giờ giữa các cửa hàng
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                  Đo lường năng suất, doanh thu và số bill của từng cửa hàng theo các ca làm việc
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {data.storePerformance.map((store) => {
                return (
                  <div key={store.storeId} className="space-y-3 pb-4 border-b border-gray-100/60 dark:border-gray-800/40 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>{store.storeName}</span>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 rounded-full">
                        Tổng DT ca: {formatVND(store.shiftPerformance?.reduce((acc, x) => acc + x.revenue, 0) || 0)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {store.shiftPerformance?.map((s, idx) => {
                        const gradients = [
                          'from-amber-500 to-orange-500',
                          'from-emerald-500 to-teal-500',
                          'from-indigo-500 to-blue-500',
                          'from-rose-500 to-pink-500',
                        ];
                        const g = gradients[idx % gradients.length];

                        const shiftTitle = s.shiftCode ? (s.shiftCode.startsWith('Ca') ? s.shiftCode : `Ca ${s.shiftCode}`) : '';

                        return (
                          <div key={s.shiftCode}
                            className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/60">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                {shiftTitle && (
                                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{shiftTitle}</div>
                                )}
                                <div className="text-xs font-bold text-gray-900 dark:text-white">{s.shiftName}</div>
                              </div>
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {s.sharePercent.toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatVND(s.revenue)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatNumber(s.invoiceCount)} bill • AOV {formatVND(s.averageOrderValue)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Xử lý TB {s.averageProcessingMinutes.toFixed(1)} phút
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden mt-3">
                              <div className={`bg-gradient-to-r ${g} h-full rounded-full transition-all duration-500`}
                                style={{ width: `${s.sharePercent}%` }} />
                            </div>
                          </div>
                        );
                      })}
                      {(!store.shiftPerformance || store.shiftPerformance.length === 0) && (
                        <div className="col-span-4 text-center py-4 text-xs text-gray-400">Không có dữ liệu ca</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed table at the bottom */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Bảng Đối Chiếu Số Liệu Chi Tiết</h2>
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
        </div>
      ) : (
        /* STANDARD AGGREGATED VIEW */
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
            <h2 className="text-lg font-bold mb-4">Năng suất theo 4 khung giờ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.shiftPerformance.map((s, idx) => {
                const gradients = [
                  'from-amber-500 to-orange-500',
                  'from-emerald-500 to-teal-500',
                  'from-indigo-500 to-blue-500',
                  'from-rose-500 to-pink-500',
                ];
                const g = gradients[idx % gradients.length];
                const shiftTitle = s.shiftCode ? (s.shiftCode.startsWith('Ca') ? s.shiftCode : `Ca ${s.shiftCode}`) : '';
                return (
                  <div key={s.shiftCode}
                    className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/60">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {shiftTitle && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{shiftTitle}</div>
                        )}
                        <div className="text-xs font-bold text-gray-900 dark:text-white">
                          {s.shiftName}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {s.sharePercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatVND(s.revenue)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatNumber(s.invoiceCount)} bill • AOV {formatVND(s.averageOrderValue)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Xử lý TB {s.averageProcessingMinutes.toFixed(1)} phút
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
