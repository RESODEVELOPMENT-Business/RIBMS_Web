'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getSalesDashboard,
  ComparisonMode,
} from '@/services/salesDashboard';
import { useStoreDashboardFilters } from '../hooks/useStoreDashboardFilters';
import StoreDateFilter from '../components/StoreDateFilter';
import ExportExcelButton from '../components/ExportExcelButton';
import ComparisonModeSelector from '../components/ComparisonModeSelector';
import { buildScopeHeaderRows, exportSheetsToExcel } from '../utils/excelExport';

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const formatNumber = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

export default function StoreComparisonPage() {
  const { storeId, fromDate, toDate, setDateRange } = useStoreDashboardFilters();
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('Auto');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storeId) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, fromDate, toDate, comparisonMode]);

  const fetchData = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await getSalesDashboard(
        storeId,
        null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
        comparisonMode,
        'None',
      );
      setData(res?.data ?? null);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải dữ liệu so sánh kỳ');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const cmp = data?.comparison;

  const handleExport = () => {
    if (!data) return;
    const summaryRows = [
      { 'Chỉ số': 'Doanh thu hiện tại (VND)', 'Giá trị': data.revenue?.actualRevenue ?? 0 },
      { 'Chỉ số': 'Doanh thu kỳ trước (VND)', 'Giá trị': cmp?.previousRevenue ?? 0 },
      { 'Chỉ số': 'Tăng trưởng DT (%)', 'Giá trị': cmp?.revenueGrowthRate ?? 0 },
      { 'Chỉ số': 'Bill hiện tại', 'Giá trị': data.invoices?.total ?? 0 },
      { 'Chỉ số': 'Bill kỳ trước', 'Giá trị': cmp?.previousInvoiceCount ?? 0 },
      { 'Chỉ số': 'Tăng trưởng bill (%)', 'Giá trị': cmp?.invoiceGrowthRate ?? 0 },
    ];
    exportSheetsToExcel('SoSanhKy_CuaHang', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({ reportName: 'So sánh kỳ (Cửa hàng)', fromDate, toDate }),
      },
      { name: 'So sánh', rows: summaryRows },
    ]);
  };

  const growthClass = (val?: number) =>
    !val ? 'text-gray-500' : val > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  const growthSign = (val?: number) => (!val ? '' : val > 0 ? '▲' : '▼');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            So Sánh Kỳ
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            BC#1 — Tăng trưởng doanh thu, hóa đơn, sản phẩm so với kỳ trước
          </p>
        </div>
        <ExportExcelButton onClick={handleExport} disabled={loading || !data} />
      </div>

      <StoreDateFilter
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={setDateRange}
        datePickerId="store-comparison-date-range"
      />

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <ComparisonModeSelector value={comparisonMode} onChange={setComparisonMode} />
      </div>

      {!storeId ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-center">
          <p className="text-gray-500">Không tìm thấy thông tin cửa hàng.</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : !data ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Doanh thu thực thu"
              current={formatVND(data.revenue?.actualRevenue ?? 0)}
              previous={formatVND(cmp?.previousRevenue ?? 0)}
              growth={cmp?.revenueGrowthRate}
              growthClass={growthClass}
              growthSign={growthSign}
            />
            <MetricCard
              title="Số hóa đơn"
              current={formatNumber(data.invoices?.total ?? 0)}
              previous={formatNumber(cmp?.previousInvoiceCount ?? 0)}
              growth={cmp?.invoiceGrowthRate}
              growthClass={growthClass}
              growthSign={growthSign}
            />
            <MetricCard
              title="Số sản phẩm"
              current="—"
              previous={formatNumber(cmp?.previousItemCount ?? 0)}
              growth={cmp?.itemGrowthRate}
              growthClass={growthClass}
              growthSign={growthSign}
            />
          </div>

          {/* Comparison period info */}
          {cmp && (
            <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 text-sm text-indigo-700 dark:text-indigo-300">
              <strong>Kỳ so sánh ({cmp.mode}):</strong>{' '}
              {cmp.previousFromDate?.split('T')[0]} → {cmp.previousToDate?.split('T')[0]}
            </div>
          )}

          {/* Revenue breakdown */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Chi tiết doanh thu kỳ hiện tại</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox label="Doanh thu gộp" value={formatVND(data.revenue?.totalAmountBeforeDiscount ?? 0)} />
              <StatBox label="Giảm khuyến mãi" value={`-${formatVND(data.revenue?.promotionDiscount ?? 0)}`} color="rose" />
              <StatBox label="Giảm nhân viên" value={`-${formatVND(data.revenue?.salesDiscount ?? 0)}`} color="rose" />
              <StatBox label="Thực thu" value={formatVND(data.revenue?.actualRevenue ?? 0)} color="emerald" bold />
            </div>
          </div>

          {/* Invoice breakdown */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Phân loại hóa đơn</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatBox label="Tổng bill" value={formatNumber(data.invoices?.total ?? 0)} />
              <StatBox label="Tại quán" value={formatNumber(data.invoices?.atStore ?? 0)} />
              <StatBox label="Mang về" value={formatNumber(data.invoices?.takeAway ?? 0)} />
              <StatBox label="Giao hàng" value={formatNumber(data.invoices?.delivery ?? 0)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title, current, previous, growth, growthClass, growthSign,
}: {
  title: string;
  current: string;
  previous: string;
  growth?: number;
  growthClass: (v?: number) => string;
  growthSign: (v?: number) => string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{title}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{current}</div>
      <div className="text-sm text-gray-400 mt-1">Kỳ trước: {previous}</div>
      {growth !== undefined && (
        <div className={`text-sm font-bold mt-2 ${growthClass(growth)}`}>
          {growthSign(growth)} {Math.abs(growth).toFixed(2)}%
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color = 'default', bold = false }: {
  label: string;
  value: string;
  color?: 'default' | 'emerald' | 'rose';
  bold?: boolean;
}) {
  const colorMap = {
    default: 'text-gray-800 dark:text-gray-100',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
  };
  return (
    <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-base ${bold ? 'font-extrabold' : 'font-semibold'} ${colorMap[color]}`}>{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-center">
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Không có dữ liệu</h3>
      <p className="text-sm text-gray-500 mt-1">Chưa có giao dịch trong khoảng thời gian đã chọn.</p>
    </div>
  );
}
