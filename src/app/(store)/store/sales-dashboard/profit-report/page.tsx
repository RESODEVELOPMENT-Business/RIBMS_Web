'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getProfitReport, ProfitReportData } from '@/services/salesDashboard';
import { DollarLineIcon, PieChartIcon, AlertIcon, BoxCubeIcon } from '@/icons';
import StoreDateFilter from '../components/StoreDateFilter';
import ExportExcelButton from '../components/ExportExcelButton';
import { useStoreDashboardFilters } from '../hooks/useStoreDashboardFilters';
import { buildScopeHeaderRows, exportSheetsToExcel } from '../utils/excelExport';

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const formatNumber = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

export default function StoreProfitReportPage() {
  const { storeId, fromDate, toDate, setDateRange } = useStoreDashboardFilters();
  const [data, setData] = useState<ProfitReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'top' | 'lowest' | 'category'>('top');

  useEffect(() => {
    if (storeId) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, fromDate, toDate]);

  const fetchData = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await getProfitReport(
        storeId,
        null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
        20,
      );
      setData(res?.data ?? null);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải báo cáo lợi nhuận');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;
    const summaryRows = [
      { 'Chỉ số': 'Doanh thu gộp', 'Giá trị (VND)': data.grossSales },
      { 'Chỉ số': 'Tổng giảm giá', 'Giá trị (VND)': data.totalDiscount },
      { 'Chỉ số': 'Doanh thu sau giảm', 'Giá trị (VND)': data.netSales },
      { 'Chỉ số': 'COGS', 'Giá trị (VND)': data.sauGiam.cogs },
      { 'Chỉ số': 'Lợi nhuận gộp', 'Giá trị (VND)': data.sauGiam.grossProfit },
      { 'Chỉ số': 'Gross margin (%)', 'Giá trị (%)': data.sauGiam.grossMargin },
      { 'Chỉ số': 'Tổng chi phí vận hành', 'Giá trị (VND)': data.sauGiam.operatingCostTotal },
      { 'Chỉ số': 'Lợi nhuận ròng', 'Giá trị (VND)': data.sauGiam.netProfit },
      { 'Chỉ số': 'Net margin (%)', 'Giá trị (%)': data.sauGiam.netMargin },
    ] as Record<string, any>[];

    const productRows = (rows: typeof data.topProfitableProducts) =>
      rows.map((p, idx) => ({
        STT: idx + 1,
        'Sản phẩm': p.productName,
        Mã: p.productCode,
        Nhóm: p.categoryName,
        'Số lượng': p.quantity,
        'Doanh thu (VND)': p.revenue,
        'COGS (VND)': p.cogs,
        'Lợi nhuận (VND)': p.grossProfit,
        'Margin (%)': p.grossMargin,
        'Cảnh báo PriceCogs': p.missingCogs ? 'Thiếu' : '',
      }));

    exportSheetsToExcel('BC4_LoiNhuan_CuaHang', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({ reportName: 'BC#4 Báo cáo lợi nhuận (Cửa hàng)', fromDate, toDate }),
      },
      { name: 'Tóm tắt', rows: summaryRows },
      {
        name: 'Chi phí vận hành',
        rows: data.sauGiam.operatingCosts.map((c) => ({
          'Loại chi phí': c.categoryName,
          'Số mục': c.costCount,
          'Tổng (VND)': c.total,
          'Tỷ trọng (%)': c.sharePercent,
          Marketing: c.isMarketing ? 'X' : '',
        })),
      },
      { name: 'Top sinh lời', rows: productRows(data.topProfitableProducts) },
      { name: 'Margin thấp', rows: productRows(data.lowestMarginProducts) },
      {
        name: 'Theo nhóm',
        rows: data.categoryProfits.map((c) => ({
          Nhóm: c.categoryName,
          'Số lượng': c.quantity,
          'Doanh thu (VND)': c.revenue,
          'COGS (VND)': c.cogs,
          'Lợi nhuận (VND)': c.grossProfit,
          'Margin (%)': c.grossMargin,
        })),
      },
    ]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Báo Cáo Lợi Nhuận
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            BC#4 — COGS, gross profit, margin theo SKU / nhóm
          </p>
        </div>
        <ExportExcelButton onClick={handleExport} disabled={loading || !data} />
      </div>

      <StoreDateFilter
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={setDateRange}
        datePickerId="store-profit-report-date-range"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          ))}
          <div className="md:col-span-3 h-72 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
        </div>
      ) : !data ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {data.dataQuality.productsMissingCogs > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300">
              <AlertIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <strong>Cảnh báo data quality:</strong>{' '}
                {data.dataQuality.productsMissingCogs}/{data.dataQuality.totalProductsWithSales} SKU chưa có giá vốn (PriceCogs),
                tương đương <strong>{data.dataQuality.missingCogsRevenueShare.toFixed(2)}%</strong> doanh thu thuần.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={<DollarLineIcon className="w-5 h-5" />} label="Doanh thu sau giảm" value={formatVND(data.netSales)} subValue={`Gross: ${formatVND(data.grossSales)}`} accent="indigo" />
            <KpiCard icon={<PieChartIcon className="w-5 h-5" />} label="COGS" value={formatVND(data.sauGiam.cogs)} subValue="Σ priceCogs × qty" accent="amber" />
            <KpiCard icon={<DollarLineIcon className="w-5 h-5" />} label="Lợi nhuận gộp" value={formatVND(data.sauGiam.grossProfit)} subValue={`Margin: ${data.sauGiam.grossMargin.toFixed(2)}%`} accent={data.sauGiam.grossProfit >= 0 ? 'emerald' : 'rose'} />
            <KpiCard icon={<DollarLineIcon className="w-5 h-5" />} label="Lợi nhuận ròng" value={formatVND(data.sauGiam.netProfit)} subValue={`Margin: ${data.sauGiam.netMargin.toFixed(2)}%`} accent={data.sauGiam.netProfit >= 0 ? 'emerald' : 'rose'} />
          </div>

          {data.sauGiam.operatingCosts.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Chi phí vận hành theo loại</h2>
                <span className="text-xs text-gray-400">Tổng: {formatVND(data.sauGiam.operatingCostTotal)} • {data.sauGiam.operatingCosts.length} danh mục</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase">Loại chi phí</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Số mục</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Tổng chi</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Tỷ trọng</th>
                      <th className="px-4 py-2.5 text-center font-bold text-gray-500 uppercase">Marketing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.sauGiam.operatingCosts.map((c) => (
                      <tr key={c.categoryId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                        <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">{c.categoryName}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{c.costCount}</td>
                        <td className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400 font-bold">-{formatVND(c.total)}</td>
                        <td className="px-4 py-2.5 text-right text-brand-600 dark:text-brand-400 font-semibold">{c.sharePercent.toFixed(2)}%</td>
                        <td className="px-4 py-2.5 text-center">
                          {c.isMarketing && <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300">MKT</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800/80 pb-3">
              <TabButton active={tab === 'top'} onClick={() => setTab('top')}>Top sinh lời</TabButton>
              <TabButton active={tab === 'lowest'} onClick={() => setTab('lowest')}>Margin thấp</TabButton>
              <TabButton active={tab === 'category'} onClick={() => setTab('category')}>Theo nhóm</TabButton>
            </div>
            {tab === 'top' && <ProductProfitTable rows={data.topProfitableProducts} title="Top 20 sản phẩm sinh lời" />}
            {tab === 'lowest' && <ProductProfitTable rows={data.lowestMarginProducts} title="Top 20 sản phẩm margin thấp nhất (đã có PriceCogs)" />}
            {tab === 'category' && <CategoryTable rows={data.categoryProfits} />}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductProfitTable({ rows, title }: { rows: any[]; title: string }) {
  return (
    <div>
      <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">Không có dữ liệu.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-2.5 text-center font-bold text-gray-500 uppercase w-12">#</th>
                <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase">Nhóm</th>
                <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">SL</th>
                <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Doanh thu</th>
                <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">COGS</th>
                <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Lợi nhuận</th>
                <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((p, idx) => {
                const isHighMargin = p.grossMargin >= 70;
                return (
                  <tr
                    key={p.productId}
                    className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/40 ${
                      p.missingCogs
                        ? 'hover:bg-gray-50/50 dark:hover:bg-gray-800/20'
                        : isHighMargin
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'bg-rose-50/40 dark:bg-rose-950/20'
                    }`}
                  >
                    <td className="px-4 py-2.5 text-center text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-gray-800 dark:text-gray-100">{p.productName}</div>
                      {p.productCode && <div className="text-xs text-gray-400">{p.productCode}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{p.categoryName}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{formatNumber(p.quantity)}</td>
                    <td className="px-4 py-2.5 text-right">{formatVND(p.revenue)}</td>
                    <td className="px-4 py-2.5 text-right text-amber-600">{formatVND(p.cogs)}</td>
                    <td className={`px-4 py-2.5 text-right font-bold ${p.grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatVND(p.grossProfit)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold">
                      {p.missingCogs ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          isHighMargin
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                        }`}>
                          {p.grossMargin.toFixed(2)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CategoryTable({ rows }: { rows: any[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">Không có dữ liệu.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
      <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase">Nhóm</th>
            <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">SL</th>
            <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Doanh thu</th>
            <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">COGS</th>
            <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Lợi nhuận</th>
            <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Margin</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((c) => {
            const isHighMargin = c.grossMargin >= 70;
            return (
              <tr
                key={c.categoryName}
                className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/40 ${
                  isHighMargin
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'bg-rose-50/40 dark:bg-rose-950/20'
                }`}
              >
                <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">{c.categoryName}</td>
                <td className="px-4 py-2.5 text-right text-gray-600">{formatNumber(c.quantity)}</td>
                <td className="px-4 py-2.5 text-right">{formatVND(c.revenue)}</td>
                <td className="px-4 py-2.5 text-right text-amber-600">{formatVND(c.cogs)}</td>
                <td className={`px-4 py-2.5 text-right font-bold ${c.grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatVND(c.grossProfit)}
                </td>
                <td className="px-4 py-2.5 text-right font-bold">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    isHighMargin
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                  }`}>
                    {c.grossMargin.toFixed(2)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentMap[accent]}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      {subValue && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subValue}</div>}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${active ? 'bg-brand-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
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
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Không có dữ liệu lợi nhuận</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">Chưa có giao dịch trong khoảng đã chọn.</p>
    </div>
  );
}
