'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getTopStoreRevenues, TopStoreRevenueItem } from '@/services/salesDashboard';
import DashboardFilters from '../components/DashboardFilters';
import ExportExcelButton from '../components/ExportExcelButton';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import {
  buildScopeHeaderRows,
  exportSheetsToExcel,
} from '../utils/excelExport';
import TopStoreRevenuesTable from '../components/TopStoreRevenuesTable';

export default function TopStoreRevenuesPage() {
  const filters = useDashboardFilters(0); // default today
  const {
    stores, storesLoading,
    selectedStoreIds, setSelectedStoreIds,
    fromDate, toDate, setDateRange,
    resolveBrandId,
  } = filters;

  const [topStoreRevenues, setTopStoreRevenues] = useState<TopStoreRevenueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!storesLoading) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreIds, fromDate, toDate, storesLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const brandIdToUse = resolveBrandId();
      if (selectedStoreIds.length === 0 && !brandIdToUse) {
        setTopStoreRevenues([]);
        setLoading(false);
        return;
      }
      const res = await getTopStoreRevenues(
        null,
        brandIdToUse || null,
        fromDate,
        toDate,
        selectedStoreIds.length > 0 ? selectedStoreIds : null,
      );
      setTopStoreRevenues(res?.data ?? []);
    } catch (err: any) {
      console.error('Failed to fetch top store revenues:', err);
      toast.error(err.message || 'Không thể tải dữ liệu top doanh thu cửa hàng');
      setTopStoreRevenues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (topStoreRevenues.length === 0) return;
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

    const rows = topStoreRevenues.map((s, idx) => ({
      STT: idx + 1,
      'Cửa hàng': s.storeName,
      'Quận / Huyện': s.districtName,
      'Số sản phẩm': s.totalProducts,
      'Số bill': s.salesInvoices,
      'Trung bình bill (VND)': s.averageBill,
      'DT trước giảm (VND)': s.revenueBeforeDiscount,
      'Giảm giá (VND)': s.discount,
      'DT sau giảm (VND)': s.revenueAfterDiscount,
      'Bill nạp thẻ': s.cardTopUpInvoices,
      'DT nạp thẻ (VND)': s.cardTopUpRevenue,
    }));

    exportSheetsToExcel('TopDoanhThuCuaHang', [
      {
        name: 'Tổng quan',
        rows: buildScopeHeaderRows({
          reportName: 'Top doanh thu cửa hàng',
          storeName,
          fromDate,
          toDate,
        }),
        columnWidths: [22, 30],
      },
      { name: 'Xếp hạng', rows, columnWidths: [6, 30, 20, 14, 12, 18, 20, 16, 20, 14, 18] },
    ]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Top Doanh Thu Cửa Hàng
          </h1>
        </div>
        <ExportExcelButton onClick={handleExport} disabled={loading || topStoreRevenues.length === 0} />
      </div>

      <DashboardFilters
        stores={stores}
        storesLoading={storesLoading}
        selectedStoreIds={selectedStoreIds}
        fromDate={fromDate}
        toDate={toDate}
        onStoreIdsChange={setSelectedStoreIds}
        onDateRangeChange={setDateRange}
        datePickerId="top-store-revenues-date-range"
        multiSelect
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
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-500">Xếp Hạng Cửa Hàng</h2>
              </div>
            </div>

            <TopStoreRevenuesTable data={topStoreRevenues} />
          </div>
        </div>
      )}
    </div>
  );
}
