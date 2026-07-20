'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  getWeeklyBreakdown,
  WeeklyBreakdownData,
} from '@/services/salesDashboard';
import { DollarLineIcon, TaskIcon, ListIcon } from '@/icons';
import StoreDateFilter from '../components/StoreDateFilter';
import ExportExcelButton from '../components/ExportExcelButton';
import { useStoreDashboardFilters } from '../hooks/useStoreDashboardFilters';
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

export default function StoreWeekly9WeeksPage() {
  const { storeId, fromDate, toDate, setDateRange } = useStoreDashboardFilters(63);

  const [data, setData] = useState<WeeklyBreakdownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<MetricTab>('revenue');

  useEffect(() => {
    if (storeId) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, fromDate, toDate]);

  const fetchData = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await getWeeklyBreakdown(
        null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
        [storeId],
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

  const formatMetric = (value: number, tab: MetricTab): string => {
    return tab === 'invoiceCount'
      ? formatNumber(value)
      : formatVND(value);
  };

  const handleExport = () => {
    if (!data || data.stores.length === 0) return;
    const storeName = data.stores[0]?.storeName;

    const headerRow: Record<string, any> = { Tuần: '' };
    data.weeks.forEach((w) => { headerRow[w.label] = ''; });

    const sheets = TABS.map((tab) => {
      const rows = data.stores.map((store) => {
        const row: Record<string, any> = { Tuần: store.storeName };
        data.weeks.forEach((_w, i) => {
          row[_w.label] = getMetricValue(store, i, tab.key);
        });
        return row;
      });

      return {
        name: tab.label,
        rows: [
          ...buildScopeHeaderRows({ reportName: `Bảng 9 tuần — ${tab.label}`, storeName, fromDate, toDate }),
          ...rows,
        ],
        columnWidths: [24, ...data.weeks.map(() => 18)],
      };
    });

    exportSheetsToExcel('Bang9Tuan', sheets);
  };

  return (
    <div className="p-6 max-w-full mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Bảng 9 Tuần
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Doanh thu, số bill, trung bình bill theo tuần
          </p>
        </div>
        <ExportExcelButton onClick={handleExport} disabled={loading || !data} />
      </div>

      <StoreDateFilter
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={setDateRange}
        datePickerId="store-weekly-9weeks-date-range"
      />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !data || data.stores.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          Không có dữ liệu trong khoảng đã chọn.
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

          {/* Matrix table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-gray-100 dark:divide-gray-800">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <th className="sticky left-0 bg-gray-50 dark:bg-gray-800/50 z-10 px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[220px]">
                      Tuần
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
                  {data.stores.length === 1 && (
                    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="sticky left-0 bg-white dark:bg-gray-900 z-10 px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">
                        {data.stores[0].storeName}
                      </td>
                      {data.weeks.map((_w, i) => {
                        const val = getMetricValue(data.stores[0], i, activeTab);
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
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
