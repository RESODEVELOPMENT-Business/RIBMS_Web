'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getCustomerMarketingReport,
  CustomerMarketingReportData,
} from '@/services/salesDashboard';
import { UserCircleIcon, GroupIcon, MailIcon, PieChartIcon } from '@/icons';
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

export default function CustomerMarketingReportPage() {
  const filters = useDashboardFilters();
  const {
    stores, storesLoading,
    selectedStoreId, setSelectedStoreId,
    fromDate, toDate, setDateRange,
    resolveBrandId,
  } = filters;

  const [data, setData] = useState<CustomerMarketingReportData | null>(null);
  const [loading, setLoading] = useState(false);

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
      const res = await getCustomerMarketingReport(
        selectedStoreId ? Number(selectedStoreId) : null,
        !selectedStoreId ? brandIdToUse : null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined,
        10,
      );
      setData(res?.data ?? null);
    } catch (err: any) {
      console.error('Failed to fetch customer/marketing report:', err);
      toast.error(err.message || 'Không thể tải báo cáo khách hàng & marketing');
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

    const summaryRows = [
      { 'Chỉ số': 'Khách đăng ký trong kỳ', 'Giá trị': data.totalCustomersInPeriod },
      { 'Chỉ số': 'Khách mới', 'Giá trị': data.newCustomers },
      { 'Chỉ số': 'Khách quay lại', 'Giá trị': data.returningCustomers },
      { 'Chỉ số': 'Tỷ lệ quay lại (%)', 'Giá trị': data.returningRate },
      { 'Chỉ số': 'TB đơn / khách', 'Giá trị': data.averageOrdersPerCustomer },
      { 'Chỉ số': 'Đơn walk-in', 'Giá trị': data.walkInOrders },
      { 'Chỉ số': 'DT khách đăng ký (VND)', 'Giá trị': data.registeredCustomerRevenue },
      { 'Chỉ số': 'Chi phí marketing (VND)', 'Giá trị': data.marketingCostTotal },
      { 'Chỉ số': 'Marketing / Revenue (%)', 'Giá trị': data.marketingToRevenueRatio },
    ];

    const costRows = data.costBreakdown.map((c) => ({
      'Loại chi phí': c.categoryName,
      'Số mục': c.costCount,
      'Tổng (VND)': c.total,
      'Marketing': c.isMarketing ? 'X' : '',
    }));

    const channelRows = data.channelRevenues.map((c) => ({
      'Kênh': c.channelName,
      'Số bill': c.invoiceCount,
      'Doanh thu (VND)': c.revenue,
      'Tỷ trọng (%)': c.sharePercent,
    }));

    const promoRows = data.topPromotions.map((p, idx) => ({
      STT: idx + 1,
      'Mã KM': p.promotionCode,
      Tên: p.promotionName,
      'Số đơn áp dụng': p.ordersApplied,
      'Tổng giảm (VND)': p.totalDiscountAmount,
      'DT attribute (VND)': p.attributedRevenue,
      'Giảm/đơn (VND)': p.averageDiscountPerOrder,
      'Top sản phẩm': p.topProducts
        .map((tp) => `${tp.productName} (×${tp.quantity})`)
        .join(', ') || '—',
    }));

    const promoProductRows = data.topPromotions.flatMap((p) =>
      p.topProducts.map((tp) => ({
        'Promotion': p.promotionName || p.promotionCode,
        'Mã KM': p.promotionCode,
        'Sản phẩm': tp.productName,
        'Số lượng': tp.quantity,
        'Doanh thu (VND)': tp.revenue,
      })),
    );

    exportSheetsToExcel('BC6_KhachHang_Marketing', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({
          reportName: 'BC#6 Báo cáo Khách hàng & Marketing',
          storeName,
          fromDate,
          toDate,
        }),
      },
      { name: 'Tóm tắt', rows: summaryRows },
      { name: 'Theo kênh', rows: channelRows },
      { name: 'Top khuyến mãi', rows: promoRows },
      { name: 'KM × Sản phẩm', rows: promoProductRows },
      { name: 'Chi phí', rows: costRows },
    ]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Báo Cáo Khách Hàng &amp; Marketing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            BC#6 — Khách mới / quay lại, doanh thu theo kênh, hiệu quả khuyến mãi
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
        datePickerId="customer-marketing-date-range"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          ))}
          <div className="md:col-span-4 h-72 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
        </div>
      ) : !data ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={<UserCircleIcon className="w-5 h-5" />}
                     label="Khách đăng ký"
                     value={formatNumber(data.totalCustomersInPeriod)}
                     subValue={`+ ${formatNumber(data.walkInOrders)} đơn walk-in`}
                     accent="indigo" />
            <KpiCard icon={<GroupIcon className="w-5 h-5" />}
                     label="Khách mới"
                     value={formatNumber(data.newCustomers)}
                     subValue={`Quay lại: ${formatNumber(data.returningCustomers)}`}
                     accent="emerald" />
            <KpiCard icon={<MailIcon className="w-5 h-5" />}
                     label="Tỷ lệ quay lại"
                     value={`${data.returningRate.toFixed(2)}%`}
                     subValue={`Trung bình ${data.averageOrdersPerCustomer.toFixed(2)} đơn/khách`}
                     accent="amber" />
            <KpiCard icon={<PieChartIcon className="w-5 h-5" />}
                     label="Chi phí marketing / DT"
                     value={`${data.marketingToRevenueRatio.toFixed(2)}%`}
                     subValue={`MKT: ${formatVND(data.marketingCostTotal)}`}
                     accent={data.marketingToRevenueRatio <= 10 ? 'emerald' : data.marketingToRevenueRatio <= 20 ? 'amber' : 'rose'} />
          </div>

          {/* Cost breakdown */}
          {data.costBreakdown.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Chi phí trong kỳ (theo loại)</h2>
                <span className="text-xs text-gray-400">
                  Marketing được nhận diện tự động theo tên loại
                </span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase">Loại chi phí</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Số mục</th>
                      <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase">Tổng (VND)</th>
                      <th className="px-4 py-2.5 text-center font-bold text-gray-500 uppercase">Loại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.costBreakdown.map((c) => (
                      <tr key={c.categoryId}
                          className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/20 ${
                            c.isMarketing ? 'bg-purple-50/40 dark:bg-purple-950/10' : ''
                          }`}>
                        <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">
                          {c.categoryName}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{c.costCount}</td>
                        <td className={`px-4 py-2.5 text-right font-bold ${c.isMarketing ? 'text-purple-600' : 'text-gray-700'}`}>
                          {formatVND(c.total)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {c.isMarketing ? (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300">
                              Marketing
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400">Vận hành</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Channel revenues */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Doanh thu theo kênh bán</h2>
              <span className="text-xs text-gray-400">
                {data.channelRevenues.length} kênh
              </span>
            </div>
            {data.channelRevenues.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">Không có dữ liệu kênh.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.channelRevenues.map((c, idx) => {
                  const gradients = [
                    'from-emerald-500 to-teal-500',
                    'from-indigo-500 to-blue-500',
                    'from-amber-500 to-orange-500',
                    'from-rose-500 to-pink-500',
                    'from-purple-500 to-violet-500',
                    'from-sky-500 to-cyan-500',
                  ];
                  const g = gradients[idx % gradients.length];
                  return (
                    <div key={c.channelCode}
                         className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/60">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                            {c.channelName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatNumber(c.invoiceCount)} hóa đơn
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                            {formatVND(c.revenue)}
                          </div>
                          <div className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                            {c.sharePercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div className={`bg-gradient-to-r ${g} h-full rounded-full transition-all duration-500`}
                             style={{ width: `${c.sharePercent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top promotions */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Hiệu quả khuyến mãi (Top 10)</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2.5 text-center font-bold text-gray-500 uppercase tracking-wider w-12">#</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wider">Mã / Tên</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Số đơn</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Tổng giảm</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Doanh thu attribute</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">Giảm/đơn</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wider">Top SP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.topPromotions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Không có promotion nào được áp dụng trong kỳ.
                      </td>
                    </tr>
                  ) : (
                    data.topPromotions.map((p, idx) => (
                      <tr key={p.promotionId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                        <td className="px-4 py-2.5 text-center text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-gray-800 dark:text-gray-100">
                            {p.promotionName || '(Không tên)'}
                          </div>
                          {p.promotionCode && (
                            <div className="text-xs text-gray-400">{p.promotionCode}</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                          {formatNumber(p.ordersApplied)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400 font-semibold">
                          -{formatVND(p.totalDiscountAmount)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatVND(p.attributedRevenue)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                          {formatVND(p.averageDiscountPerOrder)}
                        </td>
                        <td className="px-4 py-2.5">
                          {p.topProducts.length === 0 ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {p.topProducts.slice(0, 3).map((tp) => (
                                <span key={tp.productId}
                                      className="text-[11px] px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
                                      title={`SL ${tp.quantity} • ${formatVND(tp.revenue)}`}>
                                  {tp.productName} ×{tp.quantity}
                                </span>
                              ))}
                              {p.topProducts.length > 3 && (
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400">
                                  +{p.topProducts.length - 3} sp
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              <strong>Doanh thu attribute</strong>: tổng FinalAmount của các đơn có dùng promotion (không phải lợi nhuận
              do promotion mang lại — promo có thể là nguyên nhân chính hay phụ).
              Cột <strong>Top SP</strong> là các sản phẩm xuất hiện nhiều nhất trong các đơn dùng promo.
            </p>
          </div>
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
        <UserCircleIcon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Không có dữ liệu</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
        Chưa có giao dịch / khách hàng nào trong khoảng đã chọn.
      </p>
    </div>
  );
}
