'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import {
  getSalesDashboard,
  SalesDashboardData,
  PaymentMethodRevenue,
} from '@/services/salesDashboard';
import { DollarLineIcon, TaskIcon, PieChartIcon } from '@/icons';

// ── Helpers ─────────────────────────────────────────────────────────

function getTodayString(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

const formatVND = (value: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// ── Inline Components ────────────────────────────────────────────────

function InvoiceBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1 mb-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
        <span className="font-semibold text-gray-800 dark:text-gray-200">{count} hóa đơn</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function InvoicesCard({
  total,
  atStore,
  takeAway,
  delivery,
}: {
  total: number;
  atStore: number;
  takeAway: number;
  delivery: number;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/30 dark:shadow-none p-6 flex flex-col justify-between overflow-hidden relative group">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TaskIcon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Tổng số hóa đơn</h2>
          </div>
        </div>

        <div className="space-y-1 mb-6 border-b border-gray-100 dark:border-gray-800/80 pb-6">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Tổng số hóa đơn
          </span>
          <div className="text-4xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400 drop-shadow-sm">
            {total.toLocaleString('vi-VN')}
          </div>
        </div>

        <InvoiceBar label="Tại quán" count={atStore} total={total} color="bg-indigo-500" />
        <InvoiceBar label="Mang đi" count={takeAway} total={total} color="bg-purple-500" />
        <InvoiceBar label="Giao hàng" count={delivery} total={total} color="bg-sky-500" />
      </div>
    </div>
  );
}

function ShiftDatePicker({
  value,
  onChange,
  maxDate,
}: {
  value: string;
  onChange: (date: string) => void;
  maxDate?: string;
}) {
  return (
    <input
      type="date"
      value={value}
      max={maxDate ?? getTodayString()}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
      <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
      <div className="lg:col-span-2 h-80 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm text-center">
      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">
        <DollarLineIcon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
        Không có dữ liệu hiển thị
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
        Vui lòng chọn ngày hợp lệ để hiển thị thống kê doanh thu ca làm việc.
      </p>
    </div>
  );
}

function RevenueCard({ actualRevenue }: { actualRevenue: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/30 dark:shadow-none p-6 flex flex-col justify-between overflow-hidden relative group">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarLineIcon className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Doanh thu thực tế</h2>
        </div>
        <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
          {formatVND(actualRevenue)}
        </div>
      </div>
    </div>
  );
}

function PaymentMethodsCard({ paymentMethods }: { paymentMethods: PaymentMethodRevenue[] }) {
  const totalPaymentSum = paymentMethods.reduce((acc, pm) => acc + pm.amount, 0);

  const gradients = [
    'from-emerald-500 to-teal-500',
    'from-indigo-500 to-blue-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-purple-500 to-violet-500',
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/30 dark:shadow-none p-6 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Doanh thu theo phương thức thanh toán
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Phân phối nguồn tiền thực tế trong ca
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 dark:text-gray-500">Tổng thanh toán</p>
          <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
            {formatVND(totalPaymentSum)}
          </p>
        </div>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Không ghi nhận giao dịch
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {paymentMethods.map((pm, idx) => {
            const percent = totalPaymentSum > 0 ? (pm.amount / totalPaymentSum) * 100 : 0;
            const gradient = gradients[idx % gradients.length];
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
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${gradient} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page Component ──────────────────────────────────────────────────

export default function ShiftSalesDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const adminStoreId = user?.adminStoreId;

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [dashboardData, setDashboardData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (adminStoreId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminStoreId, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fromDate = `${selectedDate}T00:00:00`;
      const toDate = `${selectedDate}T23:59:59`;
      const res = await getSalesDashboard(
        adminStoreId,
        null,
        fromDate,
        toDate,
        undefined,
        'None',
      );
      setDashboardData(res?.data ?? null);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải dữ liệu kết ca');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Kết Ca — Doanh Thu Ca Làm Việc
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tổng quan doanh thu, hóa đơn và phương thức thanh toán trong ca
          </p>
        </div>
        <ShiftDatePicker value={selectedDate} onChange={setSelectedDate} />
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : !dashboardData ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueCard actualRevenue={dashboardData.revenue.actualRevenue} />
            <InvoicesCard
              total={dashboardData.invoices.total}
              atStore={dashboardData.invoices.atStore}
              takeAway={dashboardData.invoices.takeAway}
              delivery={dashboardData.invoices.delivery}
            />
          </div>
          <PaymentMethodsCard paymentMethods={dashboardData.paymentMethodRevenues} />
        </div>
      )}
    </div>
  );
}
