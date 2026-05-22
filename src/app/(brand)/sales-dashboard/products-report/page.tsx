'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getProductsReport,
  ProductsReportData,
} from '@/services/salesDashboard';
import { BoxCubeIcon, PieChartIcon } from '@/icons';
import DashboardFilters from '../components/DashboardFilters';
import ExportExcelButton from '../components/ExportExcelButton';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import {
  buildScopeHeaderRows,
  exportSheetsToExcel,
} from '../utils/excelExport';

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const formatNumber = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

export default function ProductsReportPage() {
  const filters = useDashboardFilters(7);
  const {
    stores, storesLoading,
    selectedStoreId, setSelectedStoreId,
    fromDate, toDate, setDateRange,
    resolveBrandId,
  } = filters;

  const [data, setData] = useState<ProductsReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'top' | 'slow' | 'category'>('top');

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
      const res = await getProductsReport(
        selectedStoreId ? Number(selectedStoreId) : null,
        !selectedStoreId ? brandIdToUse : null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
        20,
      );
      setData(res?.data ?? null);
    } catch (err: any) {
      console.error('Failed to fetch products report:', err);
      toast.error(err.message || 'Không thể tải báo cáo sản phẩm');
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

    const productRows = (rows: typeof data.topSellingProducts) =>
      rows.map((p, idx) => ({
        STT: idx + 1,
        'Sản phẩm': p.productName,
        Mã: p.productCode,
        Nhóm: p.categoryName,
        'Số lượng': p.quantity,
        'Doanh thu (VND)': p.revenue,
        'Tỷ trọng (%)': p.revenueShare,
      }));

    exportSheetsToExcel('BC3_SanPham', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({
          reportName: 'BC#3 Báo cáo sản phẩm',
          storeName,
          fromDate,
          toDate,
          extra: {
            'Tổng doanh thu (VND)': data.grandTotalRevenue.toString(),
            'Tổng số lượng': data.grandTotalQuantity.toString(),
          },
        }),
        columnWidths: [22, 30],
      },
      { name: 'Top bán chạy', rows: productRows(data.topSellingProducts), columnWidths: [6, 32, 14, 18, 12, 18, 14] },
      { name: 'Bán chậm', rows: productRows(data.slowMovingProducts), columnWidths: [6, 32, 14, 18, 12, 18, 14] },
      {
        name: 'Theo nhóm',
        rows: data.categoryRevenues.map((c) => ({
          Nhóm: c.categoryName,
          'Số SKU': c.skuCount,
          'Số lượng': c.quantity,
          'Doanh thu (VND)': c.revenue,
          'Tỷ trọng (%)': c.revenueShare,
        })),
        columnWidths: [22, 12, 12, 18, 14],
      },
    ]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Báo Cáo Sản Phẩm
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            BC#3 — Top SKU bán chạy / chậm và doanh thu theo nhóm sản phẩm
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
        datePickerId="products-report-date-range"
      />

      {loading ? (
        <div className="space-y-4">
          <div className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          <div className="h-96 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
        </div>
      ) : !data ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard label="Tổng số ly/món bán ra"
                         value={formatNumber(data.grandTotalQuantity)}
                         accent="indigo" />
            <SummaryCard label="Tổng doanh thu sản phẩm"
                         value={formatVND(data.grandTotalRevenue)}
                         accent="emerald" />
            <SummaryCard label="Số nhóm sản phẩm"
                         value={data.categoryRevenues.length.toString()}
                         accent="amber" />
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800/80 pb-3">
              <TabButton active={tab === 'top'} onClick={() => setTab('top')}>
                Top bán chạy
              </TabButton>
              <TabButton active={tab === 'slow'} onClick={() => setTab('slow')}>
                Bán chậm
              </TabButton>
              <TabButton active={tab === 'category'} onClick={() => setTab('category')}>
                Theo nhóm sản phẩm
              </TabButton>
            </div>

            {tab === 'top' && (
              <ProductTable rows={data.topSellingProducts} title="Top 20 sản phẩm bán chạy" />
            )}
            {tab === 'slow' && (
              <ProductTable rows={data.slowMovingProducts} title="Top 20 sản phẩm bán chậm nhất" />
            )}
            {tab === 'category' && (
              <CategoryTable rows={data.categoryRevenues} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────

function ProductTable({ rows, title }: { rows: any[]; title: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
          Không có dữ liệu sản phẩm trong kỳ.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-2.5 text-center font-bold text-gray-500 uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wider">Nhóm</th>
                <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">SL bán</th>
                <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Doanh thu</th>
                <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Tỷ trọng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((p, idx) => (
                <tr key={p.productId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                  <td className="px-4 py-2.5 text-center text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-gray-800 dark:text-gray-100">{p.productName}</div>
                    {p.productCode && (
                      <div className="text-xs text-gray-400">{p.productCode}</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{p.categoryName}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-gray-700 dark:text-gray-200">
                    {formatNumber(p.quantity)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatVND(p.revenue)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-brand-600 dark:text-brand-400 font-bold">
                    {p.revenueShare.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CategoryTable({ rows }: { rows: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Doanh thu theo nhóm sản phẩm</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
          Không có dữ liệu nhóm sản phẩm trong kỳ.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rows.map((c, idx) => {
              const gradients = [
                'from-emerald-500 to-teal-500',
                'from-indigo-500 to-blue-500',
                'from-amber-500 to-orange-500',
                'from-rose-500 to-pink-500',
                'from-purple-500 to-violet-500',
              ];
              const g = gradients[idx % gradients.length];
              return (
                <div key={c.categoryName}
                     className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/60">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-gray-800 dark:text-gray-100">{c.categoryName}</div>
                      <div className="text-xs text-gray-400">
                        {c.skuCount} SKU • {formatNumber(c.quantity)} ly/món
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800 dark:text-gray-100">
                        {formatVND(c.revenue)}
                      </div>
                      <div className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                        {c.revenueShare.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div className={`bg-gradient-to-r ${g} h-full rounded-full transition-all duration-500`}
                         style={{ width: `${c.revenueShare}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, accent }: {
  label: string;
  value: string;
  accent: 'emerald' | 'indigo' | 'amber';
}) {
  const accentMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    amber: 'text-amber-600 dark:text-amber-400',
  } as const;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{label}</div>
      <div className={`text-2xl font-bold ${accentMap[accent]}`}>{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
        active
          ? 'bg-brand-500 text-white shadow-md'
          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm text-center">
      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
        <BoxCubeIcon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Không có dữ liệu sản phẩm</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
        Chưa có sản phẩm nào được bán trong khoảng đã chọn.
      </p>
    </div>
  );
}
