'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getTopUpReport,
  TopUpReportData,
} from '@/services/salesDashboard';
import MemberCardSettlementView, {
  buildTopUpReportExcelSheets,
} from '@/components/sales-dashboard/MemberCardSettlementView';
import DashboardFilters from '../components/DashboardFilters';
import ExportExcelButton from '../components/ExportExcelButton';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import {
  buildScopeHeaderRows,
  exportSheetsToExcel,
} from '../utils/excelExport';

export default function TopUpReportPage() {
  const filters = useDashboardFilters(6);
  const {
    stores, storesLoading,
    selectedStoreIds, setSelectedStoreIds,
    fromDate, toDate, setDateRange,
    resolveBrandId,
  } = filters;

  const [report, setReport] = useState<TopUpReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const brandIdToUse = resolveBrandId();

  useEffect(() => {
    if (!storesLoading) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreIds, fromDate, toDate, storesLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (selectedStoreIds.length === 0 && !brandIdToUse) {
        setReport(null);
        setLoading(false);
        return;
      }
      const res = await getTopUpReport(
        null,
        brandIdToUse || null,
        fromDate,
        toDate,
        selectedStoreIds.length > 0 ? selectedStoreIds : null,
      );
      setReport(res?.data ?? null);
    } catch (err: any) {
      console.error('Failed to fetch top-up report:', err);
      toast.error(err.message || 'Không thể tải báo cáo nạp thẻ & đối soát');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;
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

    exportSheetsToExcel(
      'BaoCaoNapTheVaDoiSoat',
      buildTopUpReportExcelSheets({
        report,
        reportName: 'Báo cáo nạp thẻ & đối soát quỹ thành viên',
        storeName,
        fromDate,
        toDate,
        buildScopeHeaderRows,
      }),
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Báo Cáo Nạp Thẻ &amp; Đối Soát Thành Viên
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tiền nạp thẻ là khoản công ty giữ hộ (<span className="font-semibold">KHÔNG phải doanh thu</span>), đối soát tiền mặt nộp lên công ty &amp; bù trừ tiêu thẻ giữa các cửa hàng.
          </p>
        </div>
        <ExportExcelButton onClick={handleExport} disabled={loading || !report} label="Xuất Excel" />
      </div>

      <DashboardFilters
        stores={stores}
        storesLoading={storesLoading}
        selectedStoreIds={selectedStoreIds}
        fromDate={fromDate}
        toDate={toDate}
        onStoreIdsChange={setSelectedStoreIds}
        onDateRangeChange={setDateRange}
        datePickerId="top-up-report-date-range"
        multiSelect
      />

      <MemberCardSettlementView
        scope="brand"
        report={report}
        loading={loading}
        brandId={brandIdToUse || null}
        stores={stores}
        selectedStoreIds={selectedStoreIds}
        fromDate={fromDate}
        toDate={toDate}
      />
    </div>
  );
}
