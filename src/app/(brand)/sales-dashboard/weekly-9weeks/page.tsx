'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
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

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const formatNumber = (v: number) => new Intl.NumberFormat('vi-VN').format(v || 0);

type MetricTab = 'revenue' | 'invoiceCount' | 'avgBill';

const TABS: { key: MetricTab; label: string; icon?: React.ReactNode }[] = [
  { key: 'revenue', label: 'Doanh thu sau giảm giá', icon: <DollarLineIcon className="w-4 h-4" /> },
  { key: 'invoiceCount', label: 'Số lượng bill', icon: <TaskIcon className="w-4 h-4" /> },
  { key: 'avgBill', label: 'Trung bình bill', icon: <ListIcon className="w-4 h-4" /> },
];

export default function Weekly9WeeksPage() {
  const filters = useDashboardFilters(63); // default: 9 weeks back
  const {
    stores,
    storesLoading,
    selectedStoreId,
    fromDate,
    toDate,
    setDateRange,
    resolveBrandId,
  } = filters;

  // Multi-select store IDs
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [data, setData] = useState<WeeklyBreakdownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<MetricTab>('revenue');

  // When single-store filter changes → sync to multi-select
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
    return tab === 'invoiceCount' || tab === 'avgBill' && value < 100000
      ? formatNumber(value)
      : formatVND(value);
  };

  const handleExport = () => {
    if (!data) return;
    const storeName = undefined; // multi-store, skip single store name

    // 3 sheets — one per metric
    const sheets = TABS.map((tab) => {
      const headerRow: Record<string, any> = { 'Cửa hàng': 'Cửa hàng' };
      data.weeks.forEach((w, i) => {
        headerRow[w.label] = '';
      });

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

  // ── Derived totals for KPIs ──
  const totals9Weeks = useMemo(() => {
    if (!data?.totals) return { revenue: 0, invoices: 0, avgBill: 0 };
    const rev = data.totals.revenueByWeek.reduce((a, b) => a + b, 0);
    const inv = data.totals.invoiceCountByWeek.reduce((a, b) => a + b, 0);
    return { revenue: rev, invoices: inv, avgBill: inv > 0 ? Math.round(rev / inv) : 0 };
  }, [data]);

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
          {/* KPI cards */}
          {data.stores.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard
                label="Tổng doanh thu (9 tuần)"
                value={formatVND(totals9Weeks.revenue)}
                accent="emerald"
              />
              <KpiCard
                label="Tổng số bill (9 tuần)"
                value={formatNumber(totals9Weeks.invoices)}
                accent="indigo"
              />
              <KpiCard
                label="TB bill (9 tuần)"
                value={formatVND(totals9Weeks.avgBill)}
                accent="amber"
              />
            </div>
          )}

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

          {/* Matrix table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
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
                        return (
                          <td
                            key={_w.weekKey}
                            className={`px-4 py-2.5 text-right font-medium ${
                              activeTab === 'revenue'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : activeTab === 'invoiceCount'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-amber-600 dark:text-amber-400'
                            }`}
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
                      return (
                        <td
                          key={_w.weekKey}
                          className={`px-4 py-3 text-right font-extrabold ${
                            activeTab === 'revenue'
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : activeTab === 'invoiceCount'
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-amber-700 dark:text-amber-300'
                          }`}
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

// ── KPI Card component ────────────────────────────────────────────

function KpiCard({
  label,
  value,
  accent = 'brand',
}: {
  label: string;
  value: string;
  accent?: 'brand' | 'emerald' | 'indigo' | 'amber';
}) {
  const accentMap: Record<string, string> = {
    brand: 'text-brand-600 dark:text-brand-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">{label}</div>
      <div className={`mt-2 text-2xl font-extrabold ${accentMap[accent]}`}>{value}</div>
    </div>
  );
}
