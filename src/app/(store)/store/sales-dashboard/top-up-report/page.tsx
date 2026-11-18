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
import StoreDateFilter from '../components/StoreDateFilter';
import ExportExcelButton from '../components/ExportExcelButton';
import { useStoreDashboardFilters } from '../hooks/useStoreDashboardFilters';
import {
  buildScopeHeaderRows,
  exportSheetsToExcel,
} from '../utils/excelExport';

export default function StoreTopUpReportPage() {
  const { storeId, fromDate, toDate, setDateRange } = useStoreDashboardFilters(6);

  const [report, setReport] = useState<TopUpReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (storeId) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, fromDate, toDate]);

  const fetchData = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await getTopUpReport(storeId, null, fromDate, toDate);
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

    exportSheetsToExcel(
      'BaoCaoNapTheVaDoiSoat',
      buildTopUpReportExcelSheets({
        report,
        reportName: 'Báo cáo nạp thẻ & đối soát quỹ thành viên',
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
            Tiền nạp thẻ là khoản công ty giữ hộ (<span className="font-semibold">KHÔNG phải doanh thu</span>), đối soát tiền mặt nộp lên công ty &amp; bù trừ tiêu thẻ tại cửa hàng.
          </p>
        </div>
        <ExportExcelButton onClick={handleExport} disabled={loading || !report} label="Xuất Excel" />
      </div>

      <StoreDateFilter
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={setDateRange}
        datePickerId="store-top-up-report-date-range"
      />

      <MemberCardSettlementView
        scope="store"
        report={report}
        loading={loading}
        lockedStoreId={storeId}
        fromDate={fromDate}
        toDate={toDate}
      />
    </div>
  );
}
