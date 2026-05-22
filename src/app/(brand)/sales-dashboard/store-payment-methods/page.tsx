'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getStorePaymentMethods, StorePaymentMethodItem } from '@/services/salesDashboard';
import DashboardFilters from '../components/DashboardFilters';
import ExportExcelButton from '../components/ExportExcelButton';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import {
  buildScopeHeaderRows,
  exportSheetsToExcel,
} from '../utils/excelExport';
import StorePaymentMethodsTable from '../components/StorePaymentMethodsTable';

export default function StorePaymentMethodsPage() {
  const filters = useDashboardFilters();
  const {
    stores, storesLoading,
    selectedStoreId, setSelectedStoreId,
    fromDate, toDate, setDateRange,
    resolveBrandId,
  } = filters;

  const [storePaymentMethods, setStorePaymentMethods] = useState<StorePaymentMethodItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!storesLoading) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, fromDate, toDate, storesLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const brandIdToUse = resolveBrandId();
      if (!selectedStoreId && !brandIdToUse) {
        setStorePaymentMethods([]);
        setLoading(false);
        return;
      }
      const res = await getStorePaymentMethods(
        selectedStoreId ? Number(selectedStoreId) : null,
        brandIdToUse || null,
        fromDate,
        toDate,
      );
      setStorePaymentMethods(res?.data ?? []);
    } catch (err: any) {
      console.error('Failed to fetch store payment methods:', err);
      toast.error(err.message || 'Không thể tải dữ liệu doanh thu theo thanh toán');
      setStorePaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (storePaymentMethods.length === 0) return;
    const storeName =
      stores.find((s) => (s.id || s.storeId) === selectedStoreId)?.name ||
      stores.find((s) => (s.id || s.storeId) === selectedStoreId)?.storeName ||
      undefined;

    // Build a wide table: store × all payment types
    const allPaymentTypes = Array.from(
      new Map(
        storePaymentMethods
          .flatMap((s) => s.paymentMethodRevenues)
          .map((p) => [p.paymentType, p.paymentTypeName]),
      ).entries(),
    ).sort((a, b) => a[1].localeCompare(b[1]));

    const rows = storePaymentMethods.map((s, idx) => {
      const row: Record<string, any> = {
        STT: idx + 1,
        'Cửa hàng': s.storeName,
      };
      for (const [type, name] of allPaymentTypes) {
        const pm = s.paymentMethodRevenues.find((x) => x.paymentType === type);
        row[`${name} (VND)`] = pm?.amount ?? 0;
      }
      return row;
    });

    const detailRows = storePaymentMethods.flatMap((s) =>
      s.paymentMethodRevenues.map((p) => ({
        'Cửa hàng': s.storeName,
        'Phương thức': p.paymentTypeName,
        'Số giao dịch': p.transactionCount,
        'Tổng tiền (VND)': p.amount,
      })),
    );

    exportSheetsToExcel('DoanhThu_PhuongThucThanhToan', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({
          reportName: 'Doanh thu theo phương thức thanh toán',
          storeName,
          fromDate,
          toDate,
        }),
        columnWidths: [22, 30],
      },
      { name: 'Pivot', rows, columnWidths: [6, 30, ...allPaymentTypes.map(() => 18)] },
      { name: 'Chi tiết', rows: detailRows, columnWidths: [30, 24, 14, 18] },
    ]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Doanh Thu Theo Thanh Toán
          </h1>
        </div>
        <ExportExcelButton onClick={handleExport} disabled={loading || storePaymentMethods.length === 0} />
      </div>

      <DashboardFilters
        stores={stores}
        storesLoading={storesLoading}
        selectedStoreId={selectedStoreId}
        fromDate={fromDate}
        toDate={toDate}
        onStoreChange={setSelectedStoreId}
        onDateRangeChange={setDateRange}
        datePickerId="store-payment-methods-date-range"
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold animate-pulse">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/30 dark:shadow-none p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-500">Chi Tiết Hình Thức Thanh Toán</h2>
                <p className="text-sm text-gray-500 font-medium mt-1">Tính đến {new Date().toLocaleTimeString('vi-VN')}</p>
              </div>
            </div>

            <StorePaymentMethodsTable data={storePaymentMethods} />
          </div>
        </div>
      )}
    </div>
  );
}
