'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { toVietnamDateStr, startOfVietnamDay } from '@/lib/vietnamDate';

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const formatNumber = (v: number) => new Intl.NumberFormat('vi-VN').format(v);
const formatGrowth = (rate: number) => `${rate > 0 ? '+' : ''}${rate.toFixed(1)}%`;

// ── Day-of-week helpers ─────────────────────────────────────────

/** 0 = Sunday … 6 = Saturday (JS Date.getDay()) */
const WEEKDAYS = [
  { jsDay: 1, label: 'Thứ 2', short: 'T2' },
  { jsDay: 2, label: 'Thứ 3', short: 'T3' },
  { jsDay: 3, label: 'Thứ 4', short: 'T4' },
  { jsDay: 4, label: 'Thứ 5', short: 'T5' },
  { jsDay: 5, label: 'Thứ 6', short: 'T6' },
  { jsDay: 6, label: 'Thứ 7', short: 'T7' },
  { jsDay: 0, label: 'CN', short: 'CN' },
];

/** Get the most recent date for a given day-of-week (0-6).
 *  If today IS that day, return today. */
function getMostRecentDay(jsDay: number): Date {
  const today = startOfVietnamDay(new Date());
  const todayDay = today.getDay();
  const diff = (todayDay - jsDay + 7) % 7; // how many days back
  const target = new Date(today);
  target.setDate(today.getDate() - diff);
  return target;
}

/** YYYY-MM-DD (theo múi giờ VN) */
function toISO(d: Date): string {
  return toVietnamDateStr(d);
}

/** Format as dd/MM */
function formatShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function ComparisonPage() {
  const filters = useDashboardFilters();
  const {
    stores, storesLoading,
    selectedStoreIds, setSelectedStoreIds,
    fromDate, toDate, setDateRange,
    resolveBrandId,
  } = filters;

  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('Auto');

  /** Which weekday button is "active" – only meaningful when mode=DoD */
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);

  useEffect(() => {
    if (!storesLoading) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreIds, fromDate, toDate, storesLoading, comparisonMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const brandIdToUse = resolveBrandId();
      if (selectedStoreIds.length === 0 && !brandIdToUse) {
        setData(null);
        setLoading(false);
        return;
      }
      const res = await getSalesDashboard(
        null,
        selectedStoreIds.length === 0 ? brandIdToUse : null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
        comparisonMode,
        undefined,
        selectedStoreIds.length > 0 ? selectedStoreIds : null,
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

  // ── DoD day picker logic ────────────────────────────────────────

  const handlePickWeekday = useCallback(
    (jsDay: number) => {
      setSelectedWeekday(jsDay);
      const target = getMostRecentDay(jsDay);
      const iso = toISO(target);
      setDateRange(iso, iso); // single-day range
      if (comparisonMode !== 'DoD') setComparisonMode('DoD');
    },
    [comparisonMode, setDateRange],
  );

  /** Derive the "previous day" being compared (same weekday, 1 week earlier) */
  const dodInfo = useMemo(() => {
    if (comparisonMode !== 'DoD' || selectedWeekday === null) return null;
    const current = getMostRecentDay(selectedWeekday);
    const previous = new Date(current);
    previous.setDate(current.getDate() - 7);
    return { current, previous };
  }, [comparisonMode, selectedWeekday]);

  // ── Export ─────────────────────────────────────────────────────

  const handleExport = () => {
    if (!data?.comparison) return;
    const storeName =
      selectedStoreIds.length > 0
        ? selectedStoreIds
            .map((id) => {
              const s = stores.find((st) => (st.id || st.storeId) === id);
              return s?.name || s?.storeName;
            })
            .filter(Boolean)
            .join(', ')
        : undefined;

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
        selectedStoreIds={selectedStoreIds}
        fromDate={fromDate}
        toDate={toDate}
        onStoreIdsChange={setSelectedStoreIds}
        onDateRangeChange={setDateRange}
        datePickerId="comparison-date-range"
        multiSelect
      />

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <ComparisonModeSelector value={comparisonMode} onChange={setComparisonMode} />
      </div>

      {/* ── DoD: Day-of-week quick picker ──────────────────────────── */}
      {comparisonMode === 'DoD' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              📅 Chọn ngày trong tuần để so sánh
            </span>
          </div>

          {/* Day buttons */}
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map((wd) => {
              const isActive = selectedWeekday === wd.jsDay;
              const target = getMostRecentDay(wd.jsDay);
              const isFuture = target > new Date();

              return (
                <button
                  key={wd.jsDay}
                  type="button"
                  disabled={isFuture}
                  onClick={() => handlePickWeekday(wd.jsDay)}
                  className={`
                    relative flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-sm font-semibold
                    transition-all duration-200 border-2
                    ${isFuture
                      ? 'opacity-40 cursor-not-allowed border-transparent bg-gray-50 dark:bg-gray-800/30'
                      : isActive
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 shadow-md shadow-brand-500/10 scale-[1.03]'
                        : 'border-transparent bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <span className="text-xs font-bold">{wd.label}</span>
                  <span className={`text-[10px] ${isActive ? 'text-brand-500 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {formatShort(target)}
                  </span>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-white dark:border-gray-900" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Period comparison chips */}
          {dodInfo && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-800/80">
              <div className="flex-1 flex items-center gap-3 bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800/50 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-brand-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {dodInfo.current.getDate()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Kỳ này</div>
                  <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                    {dodInfo.current.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-center text-gray-300 dark:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>

              <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-gray-400 dark:bg-gray-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {dodInfo.previous.getDate()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Kỳ trước</div>
                  <div className="text-sm font-bold text-gray-600 dark:text-gray-300 truncate">
                    {dodInfo.previous.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
