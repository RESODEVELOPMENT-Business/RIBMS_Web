'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ComparisonMode,
  getSalesDashboard,
  SalesDashboardData,
} from '@/services/salesDashboard';
import { PieChartIcon } from '@/icons';
import DashboardFilters from '../components/DashboardFilters';
import ComparisonModeSelector from '../components/ComparisonModeSelector';
import ExportExcelButton from '../components/ExportExcelButton';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import {
  buildScopeHeaderRows,
  exportSheetsToExcel,
} from '../utils/excelExport';

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const formatNumber = (v: number) => new Intl.NumberFormat('vi-VN').format(v);
const formatGrowth = (rate: number) => `${rate > 0 ? '+' : ''}${rate.toFixed(1)}%`;

export default function ComparisonPage() {
  const filters = useDashboardFilters();
  const {
    stores, storesLoading,
    selectedStoreId, setSelectedStoreId,
    fromDate, toDate, setDateRange,
    resolveBrandId,
  } = filters;

  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('Auto');

  useEffect(() => {
    if (!storesLoading) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, fromDate, toDate, storesLoading, comparisonMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const brandIdToUse = resolveBrandId();
      if (!selectedStoreId && !brandIdToUse) {
        setData(null);
        setLoading(false);
        return;
      }
      const res = await getSalesDashboard(
        selectedStoreId ? Number(selectedStoreId) : null,
        !selectedStoreId ? brandIdToUse : null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
        comparisonMode,
      );
      setData(res?.data ?? null);
    } catch (err: any) {
      console.error('Failed to fetch comparison data:', err);
      toast.error(err.message || 'Không thể tải dữ liệu so sánh');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data?.comparison) return;
    const storeName =
      stores.find((s) => (s.id || s.storeId) === selectedStoreId)?.name ||
      stores.find((s) => (s.id || s.storeId) === selectedStoreId)?.storeName ||
      undefined;

    const rows = [
      { 'Chỉ số': 'Mode so sánh', 'Kỳ này': data.comparison.mode, 'Kỳ trước': '—' },
      { 'Chỉ số': 'Doanh thu (VND)', 'Kỳ này': data.revenue.actualRevenue, 'Kỳ trước': data.comparison.previousRevenue },
      { 'Chỉ số': 'Số hóa đơn', 'Kỳ này': data.invoices.total, 'Kỳ trước': data.comparison.previousInvoiceCount },
      { 'Chỉ số': 'Số ly/món', 'Kỳ này': data.invoices.total, 'Kỳ trước': data.comparison.previousItemCount },
      { 'Chỉ số': 'Tăng trưởng DT (%)', 'Kỳ này': `${data.comparison.revenueGrowthRate}%`, 'Kỳ trước': '—' },
      { 'Chỉ số': 'Tăng trưởng Bill (%)', 'Kỳ này': `${data.comparison.invoiceGrowthRate}%`, 'Kỳ trước': '—' },
    ] as Record<string, any>[];

    exportSheetsToExcel('BC_SoSanh', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({ reportName: 'So sánh kỳ trước', storeName, fromDate, toDate }),
      },
      { name: 'So sánh', rows },
    ]);
  };

  const comp = data?.comparison;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            So Sánh Kỳ Trước
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            So sánh doanh thu, hóa đơn giữa kỳ hiện tại và kỳ trước (DoD, WoW, MoM, YoY)
          </p>
        </div>
        <ExportExcelButton onClick={handleExport} disabled={loading || !comp} />
      </div>

      <DashboardFilters
        stores={stores}
        storesLoading={storesLoading}
        selectedStoreId={selectedStoreId}
        fromDate={fromDate}
        toDate={toDate}
        onStoreChange={setSelectedStoreId}
        onDateRangeChange={setDateRange}
        datePickerId="comparison-date-range"
      />

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <ComparisonModeSelector value={comparisonMode} onChange={setComparisonMode} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : !data || !comp ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
            <PieChartIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Không có dữ liệu so sánh</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
            Chọn cửa hàng và khoảng thời gian để xem so sánh với kỳ trước.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Period info */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Chế độ: </span>
              <span className="font-semibold text-brand-600 dark:text-brand-400">{comp.mode}</span>
            </div>
            <div className="flex gap-6">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Kỳ này: </span>
                <span className="font-medium">{fromDate} → {toDate}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Kỳ trước: </span>
                <span className="font-medium">
                  {new Date(comp.previousFromDate).toLocaleDateString('vi-VN')} → {new Date(comp.previousToDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ComparisonMetric
              label="Doanh thu"
              current={formatVND(data.revenue.actualRevenue)}
              previous={formatVND(comp.previousRevenue)}
              growthRate={comp.revenueGrowthRate}
              icon="💰"
            />
            <ComparisonMetric
              label="Số hóa đơn"
              current={formatNumber(data.invoices.total)}
              previous={formatNumber(comp.previousInvoiceCount)}
              growthRate={comp.invoiceGrowthRate}
              icon="🧾"
            />
            <ComparisonMetric
              label="Số ly/món"
              current={formatNumber(comp.previousItemCount + Math.round(comp.previousItemCount * comp.itemGrowthRate / 100))}
              previous={formatNumber(comp.previousItemCount)}
              growthRate={comp.itemGrowthRate}
              icon="☕"
            />
          </div>

          {/* Visual comparison bars */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-6">So sánh trực quan</h2>
            <div className="space-y-6">
              <ComparisonBar
                label="Doanh thu"
                current={data.revenue.actualRevenue}
                previous={comp.previousRevenue}
                formatValue={formatVND}
              />
              <ComparisonBar
                label="Số hóa đơn"
                current={data.invoices.total}
                previous={comp.previousInvoiceCount}
                formatValue={formatNumber}
              />
              <ComparisonBar
                label="Số ly/món"
                current={comp.previousItemCount + Math.round(comp.previousItemCount * comp.itemGrowthRate / 100)}
                previous={comp.previousItemCount}
                formatValue={formatNumber}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function ComparisonMetric({ label, current, previous, growthRate, icon }: {
  label: string;
  current: string;
  previous: string;
  growthRate: number;
  icon: string;
}) {
  const isPositive = growthRate > 0;
  const isNegative = growthRate < 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {icon} {label}
        </span>
        <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
          isPositive
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
            : isNegative
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {formatGrowth(growthRate)}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{current}</div>
      <div className="text-sm text-gray-400 dark:text-gray-500">
        Kỳ trước: <span className="font-medium text-gray-600 dark:text-gray-300">{previous}</span>
      </div>
    </div>
  );
}

function ComparisonBar({ label, current, previous, formatValue }: {
  label: string;
  current: number;
  previous: number;
  formatValue: (v: number) => string;
}) {
  const max = Math.max(current, previous, 1);
  const currentPct = (current / max) * 100;
  const previousPct = (previous / max) * 100;
  const diff = current - previous;
  const isPositive = diff > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-700 dark:text-gray-200">{label}</span>
        <span className={`text-xs font-bold ${isPositive ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-gray-500'}`}>
          {isPositive ? '+' : ''}{formatValue(diff)}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-16 shrink-0">Kỳ này</span>
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${currentPct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-28 text-right shrink-0">
            {formatValue(current)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-16 shrink-0">Kỳ trước</span>
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 transition-all duration-500"
              style={{ width: `${previousPct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-28 text-right shrink-0">
            {formatValue(previous)}
          </span>
        </div>
      </div>
    </div>
  );
}
