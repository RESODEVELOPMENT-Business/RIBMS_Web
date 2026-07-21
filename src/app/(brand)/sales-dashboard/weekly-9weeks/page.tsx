'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { ApexOptions } from 'apexcharts';
import {
  getWeeklyBreakdown,
  WeeklyBreakdownData,
} from '@/services/salesDashboard';
import { DollarLineIcon, TaskIcon, ListIcon } from '@/icons';
import DashboardFilters from '../components/DashboardFilters';
import ExportExcelButton from '../components/ExportExcelButton';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import {
  buildScopeHeaderRows,
  exportSheetsToExcel,
} from '../utils/excelExport';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const formatNumber = (v: number) => new Intl.NumberFormat('vi-VN').format(v || 0);

type MetricTab = 'revenue' | 'invoiceCount' | 'avgBill';

const TABS: { key: MetricTab; label: string; icon?: React.ReactNode }[] = [
  { key: 'revenue', label: 'Doanh thu sau giảm giá', icon: <DollarLineIcon className="w-4 h-4" /> },
  { key: 'invoiceCount', label: 'Số lượng bill', icon: <TaskIcon className="w-4 h-4" /> },
  { key: 'avgBill', label: 'Trung bình bill', icon: <ListIcon className="w-4 h-4" /> },
];

const CHART_COLORS: Record<MetricTab, string> = {
  revenue: '#10b981',
  invoiceCount: '#6366f1',
  avgBill: '#f59e0b',
};

export default function Weekly9WeeksPage() {
  const filters = useDashboardFilters(63);
  const {
    stores,
    storesLoading,
    selectedStoreId,
    fromDate,
    toDate,
    setDateRange,
    resolveBrandId,
  } = filters;

  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [data, setData] = useState<WeeklyBreakdownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<MetricTab>('revenue');

  useEffect(() => {
    if (selectedStoreId && !selectedStoreIds.includes(selectedStoreId as number)) {
      setSelectedStoreIds([selectedStoreId as number]);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    if (!storesLoading) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreIds, fromDate, toDate, storesLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const brandIdToUse = resolveBrandId();
      if (!brandIdToUse && selectedStoreIds.length === 0) {
        setData(null);
        setLoading(false);
        return;
      }
      const res = await getWeeklyBreakdown(
        !brandIdToUse ? null : brandIdToUse,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
        selectedStoreIds.length > 0 ? selectedStoreIds : null,
      );
      setData(res?.data ?? null);
    } catch (err: any) {
      console.error('Failed to fetch weekly breakdown:', err);
      toast.error(err.message || 'Không thể tải báo cáo 9 tuần');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const getMetricValue = (
    store: { revenueByWeek: number[]; invoiceCountByWeek: number[]; avgBillByWeek: number[] },
    index: number,
    tab: MetricTab,
  ): number => {
    switch (tab) {
      case 'revenue': return store.revenueByWeek[index] ?? 0;
      case 'invoiceCount': return store.invoiceCountByWeek[index] ?? 0;
      case 'avgBill': return store.avgBillByWeek[index] ?? 0;
    }
  };

  const getTotalValue = (index: number, tab: MetricTab): number => {
    if (!data) return 0;
    switch (tab) {
      case 'revenue': return data.totals.revenueByWeek[index] ?? 0;
      case 'invoiceCount': return data.totals.invoiceCountByWeek[index] ?? 0;
      case 'avgBill': return data.totals.avgBillByWeek[index] ?? 0;
    }
  };

  const formatMetric = (value: number, tab: MetricTab): string => {
    return tab === 'invoiceCount' || (tab === 'avgBill' && value < 100000)
      ? formatNumber(value)
      : formatVND(value);
  };

  const getTrendColor = (current: number, previous: number | null): string => {
    if (previous === null) return 'text-gray-500 dark:text-gray-400';
    if (current > previous) return 'text-green-600 dark:text-green-400';
    if (current < previous) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  // ── Chart config ──
  const chartCategories = useMemo(() => data?.weeks.map((w) => w.label) ?? [], [data]);
  const chartSeries = useMemo(() => {
    if (!data) return [];
    return [
      {
        name: TABS.find((t) => t.key === activeTab)?.label ?? '',
        data: data.totals.revenueByWeek.map((_, i) => getTotalValue(i, activeTab)),
      },
    ];
  }, [data, activeTab]);

  const chartOptions: ApexOptions = useMemo(() => ({
    colors: [CHART_COLORS[activeTab]],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true, dynamicAnimation: { speed: 350 } },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        borderRadius: 6,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: {
      enabled: true,
      offsetY: -6,
      style: { fontSize: '11px', fontWeight: 600, colors: ['#6b7280'] },
      formatter: (val: number) =>
        activeTab === 'revenue'
          ? formatVND(val)
          : formatNumber(val),
    },
    stroke: { show: false },
    xaxis: {
      categories: chartCategories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: '12px', fontWeight: 500 } },
    },
    yaxis: {
      labels: {
        formatter: (val: number) =>
          activeTab === 'revenue'
            ? (val >= 1_000_000 ? `${(val / 1_000_000).toFixed(1)}M` : formatVND(val))
            : formatNumber(val),
      },
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      y: {
        formatter: (val: number) =>
          activeTab === 'revenue' ? formatVND(val) : formatNumber(val),
      },
    },
    fill: { opacity: 1, type: 'gradient' as const, gradient: { shade: 'light' as const, type: 'vertical' as const, opacityFrom: 1, opacityTo: 0.85 } },
  }), [activeTab, chartCategories]);

  const handleExport = () => {
    if (!data) return;
    const storeName = undefined;

    const sheets = TABS.map((tab) => {
      const dataRows = data.stores.map((store) => {
        const row: Record<string, any> = { 'Cửa hàng': store.storeName };
        data.weeks.forEach((_w, i) => {
          row[_w.label] = getMetricValue(store, i, tab.key);
        });
        return row;
      });

      const totalRow: Record<string, any> = { 'Cửa hàng': 'TỔNG' };
      data.weeks.forEach((_w, i) => {
        totalRow[_w.label] = getTotalValue(i, tab.key);
      });

      return {
        name: tab.label,
        rows: [
          ...buildScopeHeaderRows({ reportName: `Bảng 9 tuần — ${tab.label}`, storeName, fromDate, toDate }),
          ...dataRows,
          totalRow,
        ],
        columnWidths: [24, ...data.weeks.map(() => 18)],
      };
    });

    exportSheetsToExcel('Bảng9Tuần', sheets);
  };

  return (
    <div className="p-6 max-w-full mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Bảng 9 Tuần
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            BC — Doanh thu, số bill, trung bình bill theo tuần theo từng cửa hàng
          </p>
        </div>
        <ExportExcelButton onClick={handleExport} disabled={loading || !data} />
      </div>

      <DashboardFilters
        stores={stores}
        storesLoading={storesLoading}
        selectedStoreIds={selectedStoreIds}
        onStoreIdsChange={setSelectedStoreIds}
        selectedStoreId={selectedStoreId}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={setDateRange}
        datePickerId="weekly-9weeks-date-range"
        multiSelect
      />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !data || data.stores.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          Chọn cửa hàng và khoảng thời gian để xem báo cáo 9 tuần.
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-1 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Bar chart */}
          {chartSeries.length > 0 && chartCategories.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
                  Biểu đồ tổng theo tuần
                </h2>
                <span className="text-xs text-gray-400">
                  Tổng {chartCategories.length} tuần
                </span>
              </div>
              <ReactApexChart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height={280}
              />
            </div>
          )}

          {/* Matrix table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400">
              <span>So sánh tuần liền kề:</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                Tăng
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                Giảm
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />
                Bằng / Tuần đầu
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-gray-100 dark:divide-gray-800">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <th className="sticky left-0 bg-gray-50 dark:bg-gray-800/50 z-10 px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[220px]">
                      Tên cửa hàng
                    </th>
                    {data.weeks.map((w) => (
                      <th
                        key={w.weekKey}
                        className="px-4 py-3 text-right font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px] min-w-[130px]"
                      >
                        {w.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.stores.map((store) => (
                    <tr
                      key={store.storeId}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                    >
                      <td className="sticky left-0 bg-white dark:bg-gray-900 z-10 px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">
                        {store.storeName}
                      </td>
                      {data.weeks.map((_w, i) => {
                        const val = getMetricValue(store, i, activeTab);
                        const prev = i > 0 ? getMetricValue(store, i - 1, activeTab) : null;
                        return (
                          <td
                            key={_w.weekKey}
                            className={`px-4 py-2.5 text-right font-medium ${getTrendColor(val, prev)}`}
                          >
                            {formatMetric(val, activeTab)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-brand-50/50 dark:bg-brand-950/10 font-bold">
                    <td className="sticky left-0 bg-brand-50/50 dark:bg-brand-950/10 z-10 px-4 py-3 text-brand-700 dark:text-brand-300 uppercase tracking-wider text-xs">
                      Tổng
                    </td>
                    {data.weeks.map((_w, i) => {
                      const val = getTotalValue(i, activeTab);
                      const prev = i > 0 ? getTotalValue(i - 1, activeTab) : null;
                      return (
                        <td
                          key={_w.weekKey}
                          className={`px-4 py-3 text-right font-extrabold ${getTrendColor(val, prev)}`}
                        >
                          {formatMetric(val, activeTab)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
