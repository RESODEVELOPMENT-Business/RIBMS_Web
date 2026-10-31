'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import DashboardFilters from '../components/DashboardFilters';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import { getMaterialConsumptionReport, syncHangHoaMaterials } from '@/services/materialReports';
import { MaterialConsumptionReportData } from '@/types/materialReport';
import MaterialViewTable from './components/MaterialViewTable';
import ProductViewTable from './components/ProductViewTable';
import RecipeConfigModal from './components/RecipeConfigModal';

export default function MaterialConsumptionReportPage() {
  const {
    stores,
    storesLoading,
    selectedStoreId,
    setSelectedStoreId,
    selectedStoreIds,
    setSelectedStoreIds,
    fromDate,
    toDate,
    setDateRange,
    resolveBrandId,
  } = useDashboardFilters(0);

  const [activeTab, setActiveTab] = useState<'material' | 'product'>('material');
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [reportData, setReportData] = useState<MaterialConsumptionReportData | null>(null);

  // Recipe Modal State
  const [recipeModalState, setRecipeModalState] = useState<{
    isOpen: boolean;
    productId: number;
    productName: string;
    productCode?: string;
  }>({
    isOpen: false,
    productId: 0,
    productName: '',
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const brandId = resolveBrandId();
      const storeIdToPass =
        selectedStoreIds.length === 1
          ? selectedStoreIds[0]
          : typeof selectedStoreId === 'number'
          ? selectedStoreId
          : undefined;

      const res = await getMaterialConsumptionReport({
        storeId: storeIdToPass,
        brandId,
        fromDate,
        toDate,
        viewMode: 'all',
      });

      if (res && res.data) {
        setReportData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load material consumption report:', err);
      toast.error(err?.message || 'Không thể tải báo cáo tiêu hao vật tư');
    } finally {
      setLoading(false);
    }
  };

  const storeIdsKey = selectedStoreIds.join(',');

  useEffect(() => {
    if (!storesLoading) {
      void fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeIdsKey, selectedStoreId, fromDate, toDate, storesLoading]);

  const handleSyncHangHoa = async () => {
    setSyncing(true);
    try {
      const res = await syncHangHoaMaterials();
      toast.success(res?.message || 'Đã đồng bộ danh mục vật tư từ HangHoa thành công');
      fetchReport();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi đồng bộ từ HangHoa');
    } finally {
      setSyncing(false);
    }
  };

  const openRecipeModal = (productId: number, productName: string, productCode?: string) => {
    setRecipeModalState({
      isOpen: true,
      productId,
      productName,
      productCode,
    });
  };

  const closeRecipeModal = () => {
    setRecipeModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const totalSoldCups = reportData?.totalSoldCups || 0;
  const totalDistinctMaterials = reportData?.totalDistinctMaterials || 0;
  const overConsumedCount =
    reportData?.byMaterial?.filter(
      (m) => m.totalInward > 0 && m.totalConsumedPackage > m.totalInward
    ).length || 0;

  const currentStoreName = useMemo(() => {
    if (selectedStoreIds.length === 1) {
      const found = stores.find((s) => (s.id || s.storeId) === selectedStoreIds[0]);
      return found?.name || found?.storeName || `Cửa hàng #${selectedStoreIds[0]}`;
    }
    if (selectedStoreIds.length > 1) {
      return `${selectedStoreIds.length} cửa hàng`;
    }
    if (typeof selectedStoreId === 'number' && selectedStoreId > 0) {
      const found = stores.find((s) => (s.id || s.storeId) === selectedStoreId);
      return found?.name || found?.storeName || `Cửa hàng #${selectedStoreId}`;
    }
    return 'Tất cả cửa hàng';
  }, [stores, selectedStoreIds, selectedStoreId]);

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Báo cáo tiêu hao vật tư & Định lượng
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {currentStoreName}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Đối chiếu số lượng nhập kho HangHoa với lượng tiêu hao lý thuyết
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/product-items"
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition border border-gray-200 dark:border-gray-700"
          >
            Danh mục vật tư
          </Link>

          <button
            type="button"
            onClick={handleSyncHangHoa}
            disabled={syncing}
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition disabled:opacity-50"
          >
            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ HangHoa'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilters
        stores={stores}
        storesLoading={storesLoading}
        selectedStoreId={selectedStoreId}
        selectedStoreIds={selectedStoreIds}
        fromDate={fromDate}
        toDate={toDate}
        onStoreChange={setSelectedStoreId}
        onStoreIdsChange={setSelectedStoreIds}
        onDateRangeChange={setDateRange}
        datePickerId="material-report-date-range"
        multiSelect
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <span className="text-xs font-medium text-gray-500">Tổng sản phẩm đã bán</span>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {totalSoldCups.toLocaleString('vi-VN')} <span className="text-xs font-normal text-gray-400">ly</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <span className="text-xs font-medium text-gray-500">Vật tư tiêu hao</span>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {totalDistinctMaterials} <span className="text-xs font-normal text-gray-400">loại</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <span className="text-xs font-medium text-gray-500">Tiêu hao vượt nhập</span>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            <span className={overConsumedCount > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}>
              {overConsumedCount}
            </span>{' '}
            <span className="text-xs font-normal text-gray-400">vật tư</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('material')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition ${
            activeTab === 'material'
              ? 'bg-brand-500 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Theo nguyên vật liệu
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('product')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition ${
            activeTab === 'product'
              ? 'bg-brand-500 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Theo món bán ra
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center text-xs text-gray-400">
          Đang tải dữ liệu...
        </div>
      ) : activeTab === 'material' ? (
        <MaterialViewTable items={reportData?.byMaterial || []} />
      ) : (
        <ProductViewTable
          items={reportData?.byProduct || []}
          onOpenRecipeModal={openRecipeModal}
        />
      )}

      {/* Recipe Config Modal */}
      <RecipeConfigModal
        productId={recipeModalState.productId}
        productName={recipeModalState.productName}
        productCode={recipeModalState.productCode}
        isOpen={recipeModalState.isOpen}
        onClose={closeRecipeModal}
        onSaved={fetchReport}
      />
    </div>
  );
}
