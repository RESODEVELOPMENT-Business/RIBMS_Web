'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { getStores } from '@/services/stores';
import { getSalesDashboard, SalesDashboardData } from '@/services/salesDashboard';
import {
  DollarLineIcon,
  TaskIcon,
  CalenderIcon,
  PieChartIcon,
  GridIcon,
  TimeIcon,
  CheckCircleIcon
} from '@/icons';
import DatePicker from '@/components/form/date-picker';

// Simple formatter for currency
const formatVND = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export default function SalesDashboardPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('');

  // Date filters (defaults: from 7 days ago to today)
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [dashboardData, setDashboardData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [storesLoading, setStoresLoading] = useState<boolean>(true);

  // Create a joined string for flatpickr range format to satisfy the DateOption type
  const dateRange = `${fromDate} to ${toDate}`;

  // Memoize onChange handler to prevent re-initialization
  const handleDateRangeChange = React.useCallback((selectedDates: Date[], dateStr: string) => {
    if (selectedDates.length === 2) {
      const parts = dateStr.split(' to ');
      if (parts.length === 2) {
        setFromDate(parts[0]);
        setToDate(parts[1]);
      }
    }
  }, []);

  // Load stores first
  useEffect(() => {
    const fetchStores = async () => {
      setStoresLoading(true);
      try {
        const brandId = useAuthStore.getState().user?.brandId;
        const res = await getStores(1, 100, brandId || undefined);
        if (res && res.data) {
          const items = res.data.items || res.data;
          setStores(items);
          if (items.length > 0) {
            // Default to "All Stores" (empty) when opened
            setSelectedStoreId('');
          }
        }
      } catch (err) {
        console.error('Failed to fetch stores:', err);
        toast.error('Không thể tải danh sách cửa hàng');
      } finally {
        setStoresLoading(false);
      }
    };
    fetchStores();
  }, []);

  // Fetch dashboard data whenever store or dates change (and after stores are loaded)
  useEffect(() => {
    if (!storesLoading) {
      fetchDashboard();
    }
  }, [selectedStoreId, fromDate, toDate, storesLoading]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      let brandIdToUse = useAuthStore.getState().user?.brandId;
      if (!brandIdToUse && stores.length > 0) {
        brandIdToUse = stores[0].brandId || stores[0].BrandId;
      }

      if (!selectedStoreId && !brandIdToUse) {
        setDashboardData(null);
        setLoading(false);
        return;
      }

      const res = await getSalesDashboard(
        selectedStoreId ? Number(selectedStoreId) : null,
        !selectedStoreId ? brandIdToUse : null,
        fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate ? `${toDate}T23:59:59` : undefined
      );
      if (res && res.data) {
        setDashboardData(res.data);
      } else {
        setDashboardData(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch sales dashboard:', err);
      toast.error(err.message || 'Không thể tải dữ liệu báo cáo doanh thu');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  // Date Preset Handlers
  const handlePreset = (days: number) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);

    setFromDate(start.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
  };

  // Compute payment method statistics
  const totalPaymentSum = useMemo(() => {
    if (!dashboardData?.paymentMethodRevenues) return 0;
    return dashboardData.paymentMethodRevenues.reduce((acc, curr) => acc + curr.amount, 0);
  }, [dashboardData]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">

      {/* ── Header & Title ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Báo Cáo Doanh Thu Bán Hàng
          </h1>
        </div>
      </div>

      {/* ── Filters Section ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-xl shadow-gray-100/50 dark:shadow-none space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Store Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Cửa Hàng
            </label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(Number(e.target.value))}
              disabled={storesLoading}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none disabled:opacity-50"
            >
              {storesLoading ? (
                <option value="">Đang tải cửa hàng...</option>
              ) : (
                <>
                  <option value="">Tất cả cửa hàng (Toàn hệ thống)</option>
                  {stores.map((s) => (
                    <option key={s.id || s.storeId} value={s.id || s.storeId}>
                      {s.name || s.storeName}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Date Range Picker */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Khoảng Thời Gian
            </label>
            <DatePicker
              id="dashboard-date-range"
              mode="range"
              defaultDate={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>

        </div>

        {/* Presets Row */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800/80">
          <button
            type="button"
            onClick={() => handlePreset(0)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => handlePreset(3)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            3 ngày qua
          </button>
          <button
            type="button"
            onClick={() => handlePreset(7)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => handlePreset(30)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            30 ngày qua
          </button>
        </div>
      </div>

      {/* ── Main Dashboard Content ────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
          <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
          <div className="lg:col-span-2 h-80 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
        </div>
      ) : !dashboardData ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
            <DollarLineIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Không có dữ liệu hiển thị</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
            Vui lòng chọn cửa hàng và khoảng thời gian hợp lệ để hiển thị thống kê báo cáo doanh thu.
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Top Row: Revenue Summary and Invoice Counters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 1. SECTION: Tổng Doanh Thu Bán Hàng */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/30 dark:shadow-none p-6 flex flex-col justify-between overflow-hidden relative group">
              {/* Decorative radial gradients for high-end look */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <DollarLineIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 dark:text-white">Tổng doanh thu bán hàng</h2>
                    </div>
                  </div>
                </div>

                {/* Main Hero: Actual Revenue */}
                <div className="space-y-1 mb-6 border-b border-gray-100 dark:border-gray-800/80 pb-6">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Doanh thu Thực Tế (3)
                  </span>
                  <div className="text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 drop-shadow-sm transition-all duration-300">
                    {formatVND(dashboardData.revenue.actualRevenue)}
                  </div>
                </div>

                {/* Sub breakdown list */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Doanh thu trước giảm giá (1)</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {formatVND(dashboardData.revenue.totalAmountBeforeDiscount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Giảm giá (2.1)</span>
                    <span className="font-semibold text-red-500 dark:text-red-400">
                      -{formatVND(dashboardData.revenue.promotionDiscount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Giảm giá bán hàng (2.2)</span>
                    <span className="font-semibold text-red-500 dark:text-red-400">
                      -{formatVND(dashboardData.revenue.salesDiscount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-3.5 border-t border-gray-100 dark:border-gray-800/80 font-medium">
                    <span className="text-gray-700 dark:text-gray-300">Tổng giảm giá bán hàng (2)=(2.1)+(2.2)</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      -{formatVND(dashboardData.revenue.totalDiscount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SECTION: Tổng Số Hóa Đơn Bán Hàng */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/30 dark:shadow-none p-6 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <TaskIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 dark:text-white">Tổng số hóa đơn bán hàng</h2>
                    </div>
                  </div>
                </div>

                {/* Main Hero: Total Invoices */}
                <div className="space-y-1 mb-6 border-b border-gray-100 dark:border-gray-800/80 pb-6">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Tổng số hóa đơn
                  </span>
                  <div className="text-4xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400 drop-shadow-sm">
                    {dashboardData.invoices.total}
                  </div>
                </div>

                {/* Invoice Type Breakdowns with animated mini visual bars */}
                <div className="space-y-4">
                  {/* Tại quán */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Tại quán (1)</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {dashboardData.invoices.atStore} hóa đơn
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${dashboardData.invoices.total > 0 ? (dashboardData.invoices.atStore / dashboardData.invoices.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Mang đi */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Mang đi (2)</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {dashboardData.invoices.takeAway} hóa đơn
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${dashboardData.invoices.total > 0 ? (dashboardData.invoices.takeAway / dashboardData.invoices.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Giao hàng */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Giao hàng (3)</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {dashboardData.invoices.delivery} hóa đơn
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${dashboardData.invoices.total > 0 ? (dashboardData.invoices.delivery / dashboardData.invoices.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* 3. SECTION: Bảng tổng doanh thu theo các phương thức thanh toán */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/30 dark:shadow-none p-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <PieChartIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">Tổng doanh thu theo phương thức thanh toán</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Phân phối nguồn tiền thực tế đổ về hệ thống</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400 dark:text-gray-500">Cộng gộp tổng thanh toán</p>
                <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
                  {formatVND(totalPaymentSum)}
                </p>
              </div>
            </div>

            {/* List and visual breakdown of payment methods */}
            {dashboardData.paymentMethodRevenues.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">Không ghi nhận giao dịch thanh toán nào trong kỳ.</p>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Horizontal progress/share bars with beautiful style */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {dashboardData.paymentMethodRevenues.map((pm, idx) => {
                    const percent = totalPaymentSum > 0 ? (pm.amount / totalPaymentSum) * 100 : 0;

                    // Curated beautiful dynamic gradient based on index
                    const gradients = [
                      'from-emerald-500 to-teal-500',
                      'from-indigo-500 to-blue-500',
                      'from-amber-500 to-orange-500',
                      'from-rose-500 to-pink-500',
                      'from-purple-500 to-violet-500',
                    ];
                    const selectedGradient = gradients[idx % gradients.length];

                    return (
                      <div
                        key={pm.paymentType}
                        className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/60 flex flex-col justify-between hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-sm font-bold text-gray-800 dark:text-white block">
                              {pm.paymentTypeName}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {pm.transactionCount} giao dịch
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-800 dark:text-white block">
                              {formatVND(pm.amount)}
                            </span>
                            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                              {percent.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* Beautiful gradient bar */}
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                          <div
                            className={`bg-gradient-to-r ${selectedGradient} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Table representation for perfect precision list view */}
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800/80 mt-6">
                  <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Phương thức</th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Số giao dịch</th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Tổng tiền</th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Tỷ lệ đóng góp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {dashboardData.paymentMethodRevenues.map((pm) => {
                        const percent = totalPaymentSum > 0 ? (pm.amount / totalPaymentSum) * 100 : 0;
                        return (
                          <tr key={pm.paymentType} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {pm.paymentTypeName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                              {pm.transactionCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-gray-800 dark:text-gray-100">
                              {formatVND(pm.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-600 dark:text-emerald-400 font-bold">
                              {percent.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
