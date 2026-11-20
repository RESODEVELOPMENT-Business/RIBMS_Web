'use client';

import React, { useMemo, useState } from 'react';
import {
  TopUpDailyTrendItem,
  TopUpReportData,
} from '@/services/salesDashboard';
import MemberCardLedgerTab from './MemberCardLedgerTab';

interface StoreOption {
  id?: number;
  storeId?: number;
  name?: string;
  storeName?: string;
}

interface MemberCardSettlementViewProps {
  scope: 'brand' | 'store';
  report: TopUpReportData | null;
  loading: boolean;
  brandId?: number | null;
  lockedStoreId?: number | null;
  stores?: StoreOption[];
  selectedStoreIds?: number[];
  fromDate: string;
  toDate: string;
}

export function buildTopUpReportExcelSheets(params: {
  report: TopUpReportData;
  reportName: string;
  storeName?: string;
  fromDate?: string;
  toDate?: string;
  buildScopeHeaderRows: (args: {
    reportName: string;
    storeName?: string;
    fromDate?: string;
    toDate?: string;
  }) => Record<string, any>[];
}) {
  const { report, reportName, storeName, fromDate, toDate, buildScopeHeaderRows } = params;

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return d;
    }
  };

  const summaryRows: { 'Chỉ tiêu': string; 'Giá trị': number }[] = [
    { 'Chỉ tiêu': 'Thực thu nạp thẻ (VND)', 'Giá trị': report.totalTopUpRevenue ?? 0 },
    { 'Chỉ tiêu': '  - Tiền mặt nạp thẻ (VND)', 'Giá trị': report.totalTopUpCashRevenue ?? 0 },
    { 'Chỉ tiêu': '  - CK / Khác nạp thẻ (VND)', 'Giá trị': report.totalTopUpNonCashRevenue ?? 0 },
    ...((report.totalTopUpUnclassifiedInvoices ?? 0) > 0
      ? [
          {
            'Chỉ tiêu': '  - Thiếu dữ liệu PTTT (VND)',
            'Giá trị': report.totalTopUpUnclassifiedRevenue ?? 0,
          },
        ]
      : []),
    { 'Chỉ tiêu': 'Số giao dịch nạp hợp lệ', 'Giá trị': report.totalTopUpInvoices ?? 0 },
    { 'Chỉ tiêu': 'Tiền mặt bán hàng (VND)', 'Giá trị': report.totalSalesCashRevenue ?? 0 },
    { 'Chỉ tiêu': 'Tổng tiền mặt phải nộp công ty (VND)', 'Giá trị': report.totalCashToRemit ?? 0 },
    { 'Chỉ tiêu': 'Thực tiêu Member Credit (VND)', 'Giá trị': report.totalMemberCreditSpent ?? 0 },
    { 'Chỉ tiêu': 'Chênh lệch bù trừ trong kỳ (VND)', 'Giá trị': report.netPeriodSettlementDelta ?? 0 },
  ];

  if (report.currentSystemLiabilityBalance != null) {
    summaryRows.push({
      'Chỉ tiêu': 'Số dư ví công ty đang giữ hộ hiện tại (VND)',
      'Giá trị': report.currentSystemLiabilityBalance,
    });
  }

  const dailyRows = report.dailyTrend.map((d) => ({
    'Ngày': formatDate(d.date),
    'Thực thu nạp (VND)': d.revenue,
    'Số giao dịch': d.invoices,
  }));

  const storeRows = report.storeBreakdown.map((s, idx) => ({
    'STT': idx + 1,
    'Cửa hàng': s.storeName,
    'Quận / Huyện': s.districtName ?? '-',
    'TM Bán hàng (VND)': s.salesCashAmount ?? 0,
    'CK/Khác Bán hàng (VND)': s.salesNonCashAmount ?? 0,
    'TM Nạp thẻ (VND)': s.topUpCashAmount ?? 0,
    'CK/Khác Nạp thẻ (VND)': s.topUpNonCashAmount ?? 0,
    'Tổng TM phải nộp (VND)': s.totalCashToRemit ?? 0,
    'Thực thu Nạp thẻ (VND)': s.revenue,
    'Số bill nạp': s.invoices,
    'Thực tiêu Member Credit (VND)': s.salesMemberCreditAmount ?? 0,
    'Chênh lệch bù trừ (VND)': s.netSettlementDelta ?? 0,
    'Tỷ trọng nạp (%)': s.sharePercent,
  }));

  return [
    {
      name: 'Tổng quan',
      rows: buildScopeHeaderRows({ reportName, storeName, fromDate, toDate }),
      columnWidths: [24, 34],
    },
    { name: 'Tổng hợp', rows: summaryRows, columnWidths: [42, 22] },
    { name: 'Theo ngày', rows: dailyRows, columnWidths: [14, 22, 16] },
    {
      name: 'Theo cửa hàng',
      rows: storeRows,
      columnWidths: [6, 28, 18, 20, 22, 18, 22, 24, 22, 14, 26, 24, 16],
    },
  ];
}

export default function MemberCardSettlementView({
  scope,
  report,
  loading,
  brandId,
  lockedStoreId,
  stores = [],
  selectedStoreIds = [],
  fromDate,
  toDate,
}: MemberCardSettlementViewProps) {
  const [activeTab, setActiveTab] = useState<'settlement' | 'ledger'>('settlement');
  const [storeSearch, setStoreSearch] = useState('');
  const [drilldownStoreId, setDrilldownStoreId] = useState<number | null>(null);
  const isStoreView = scope === 'store';
  const storeId = lockedStoreId ?? null;

  const formatVnd = (n: number | null | undefined) =>
    new Intl.NumberFormat('vi-VN').format(n ?? 0);

  const maxDailyRevenue = useMemo(() => {
    if (!report?.dailyTrend?.length) return 1;
    return Math.max(...report.dailyTrend.map((d) => d.revenue), 1);
  }, [report]);

  const filteredStores = useMemo(() => {
    const list = report?.storeBreakdown ?? [];
    const q = storeSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.storeName.toLowerCase().includes(q) ||
        (s.districtName && s.districtName.toLowerCase().includes(q)),
    );
  }, [report, storeSearch]);

  const tableTotals = useMemo(() => {
    return filteredStores.reduce(
      (acc, s) => ({
        salesCash: acc.salesCash + (s.salesCashAmount ?? 0),
        salesNonCash: acc.salesNonCash + (s.salesNonCashAmount ?? 0),
        topUpCash: acc.topUpCash + (s.topUpCashAmount ?? 0),
        topUpNonCash: acc.topUpNonCash + (s.topUpNonCashAmount ?? 0),
        totalCashToRemit: acc.totalCashToRemit + (s.totalCashToRemit ?? 0),
        topUpRev: acc.topUpRev + (s.revenue ?? 0),
        topUpInvoices: acc.topUpInvoices + (s.invoices ?? 0),
        memberSpent: acc.memberSpent + (s.salesMemberCreditAmount ?? 0),
        delta: acc.delta + (s.netSettlementDelta ?? 0),
      }),
      {
        salesCash: 0,
        salesNonCash: 0,
        topUpCash: 0,
        topUpNonCash: 0,
        totalCashToRemit: 0,
        topUpRev: 0,
        topUpInvoices: 0,
        memberSpent: 0,
        delta: 0,
      },
    );
  }, [filteredStores]);

  const showLiabilityCard =
    scope === 'brand' && report?.currentSystemLiabilityBalance != null;

  const handleOpenStoreLedger = (storeId: number) => {
    setDrilldownStoreId(storeId);
    setActiveTab('ledger');
  };

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('settlement')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'settlement'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Đối soát Quỹ &amp; Thẻ theo Cửa hàng
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'ledger'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Tra cứu Lịch sử Thẻ (Nạp – Tiêu – Hoàn)
        </button>
      </div>

      {activeTab === 'ledger' ? (
        <MemberCardLedgerTab
          scope={scope}
          brandId={brandId}
          lockedStoreId={lockedStoreId}
          stores={stores}
          parentStoreIds={selectedStoreIds}
          fromDate={fromDate}
          toDate={toDate}
          selectedDrilldownStoreId={drilldownStoreId}
          onSelectDrilldownStoreId={setDrilldownStoreId}
        />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-semibold animate-pulse">Đang tải dữ liệu đối soát...</p>
        </div>
      ) : !report ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-gray-400">Không có dữ liệu đối soát thẻ thành viên trong khoảng thời gian này.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(report.totalTopUpUnclassifiedInvoices ?? 0) > 0 && (
            <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
              <span>
                Cảnh báo: Có{' '}
                <strong>{report.totalTopUpUnclassifiedInvoices}</strong> đơn nạp
                thẻ thiếu dữ liệu Payment — không tự xếp vào CK/Khác để tránh
                sai lệch tiền mặt phải nộp.
              </span>
              <strong className="tabular-nums whitespace-nowrap">
                {formatVnd(report.totalTopUpUnclassifiedRevenue ?? 0)}₫
              </strong>
            </div>
          )}
          {/* KPI Summary Cards */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${
              showLiabilityCard ? 'xl:grid-cols-4' : 'xl:grid-cols-3'
            } gap-4`}
          >
            {/* 1. Net Top-Ups */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Thực thu nạp thẻ (trừ hủy)
              </p>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                {formatVnd(report.totalTopUpRevenue)}₫
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 tabular-nums">
                TM: <strong className="text-gray-700 dark:text-gray-200">{formatVnd(report.totalTopUpCashRevenue)}₫</strong>
                {' · '}
                CK/Khác: <strong className="text-gray-700 dark:text-gray-200">{formatVnd(report.totalTopUpNonCashRevenue)}₫</strong>
                {' · '}
                {report.totalTopUpInvoices} bill
              </p>
            </div>

            {/* 2. Member Credit Spend + Cash to Remit */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Thực tiêu Member Credit
              </p>
              <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-1 tabular-nums">
                {formatVnd(report.totalMemberCreditSpent)}₫
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 tabular-nums">
                Tổng TM nộp công ty:{' '}
                <strong className="text-emerald-700 dark:text-emerald-400">
                  {formatVnd(report.totalCashToRemit)}₫
                </strong>
              </p>
            </div>

            {/* 3. Net Period Settlement Delta */}
            {(() => {
              const delta = report.netPeriodSettlementDelta ?? 0;
              const isPositive = delta >= 0;
              return (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-xs">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Chênh lệch bù trừ trong kỳ
                  </p>
                  <p
                    className={`text-2xl font-extrabold mt-1 tabular-nums ${
                      isPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {delta > 0 ? '+' : ''}
                    {formatVnd(delta)}₫
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {isPositive
                      ? 'Thu nạp ≥ Tiêu thẻ (Cửa hàng giữ/nộp về CTy)'
                      : 'Tiêu thẻ > Thu nạp (Công ty bù trả cửa hàng)'}
                  </p>
                </div>
              );
            })()}

            {/* 4. Company Liability Balance (Brand/Admin only) */}
            {showLiabilityCard && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-xs">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Số dư ví CTy đang giữ hộ
                </p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1 tabular-nums">
                  {formatVnd(report.currentSystemLiabilityBalance)}₫
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Số dư lũy kế hiện tại (không phụ thuộc ngày lọc)
                </p>
              </div>
            )}
          </div>

          {/* Store Reconciliation Table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Bảng đối soát tiền nộp &amp; bù trừ thẻ theo cửa hàng
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Tổng TM phải nộp = TM Bán hàng + TM Nạp thẻ · Chênh lệch bù trừ = Thực thu Nạp thẻ − Thực tiêu Member Credit
                </p>
              </div>
              {scope === 'brand' && (
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Tìm cửa hàng..."
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 sm:w-64"
                />
              )}
            </div>

            {filteredStores.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                Không có dữ liệu bán hàng hoặc nạp thẻ trong khoảng thời gian đã chọn.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/70 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-3 text-center">STT</th>
                      <th className="px-3 py-3">Cửa hàng</th>
                      <th className="px-3 py-3 text-right">TM Bán hàng</th>
                      <th className="px-3 py-3 text-right">CK/Khác Bán hàng</th>
                      <th className="px-3 py-3 text-right">TM Nạp thẻ</th>
                      <th className="px-3 py-3 text-right">CK/Khác Nạp thẻ</th>
                      <th className="px-3 py-3 text-right bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                        Tổng TM phải nộp
                      </th>
                      <th className="px-3 py-3 text-right">Thực thu Nạp</th>
                      <th className="px-3 py-3 text-right">Thực tiêu Thẻ</th>
                      <th className="px-3 py-3 text-right">Chênh lệch bù trừ</th>
                      <th className="px-3 py-3 text-center">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredStores.map((s, idx) => {
                      const delta = s.netSettlementDelta ?? 0;
                      return (
                        <tr key={s.storeId} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                          <td className="px-3 py-3 text-center text-gray-500 tabular-nums">{idx + 1}</td>
                          <td className="px-3 py-3 font-medium text-gray-900 dark:text-gray-100 min-w-[180px]">
                            <div>{s.storeName}</div>
                            {s.districtName && (
                              <div className="text-[11px] text-gray-400">{s.districtName}</div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                            {formatVnd(s.salesCashAmount)}₫
                          </td>
                          <td className="px-3 py-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                            {formatVnd(s.salesNonCashAmount)}₫
                          </td>
                          <td className="px-3 py-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                            {formatVnd(s.topUpCashAmount)}₫
                          </td>
                          <td className="px-3 py-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                            {formatVnd(s.topUpNonCashAmount)}₫
                          </td>
                          <td className="px-3 py-3 text-right font-bold bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 tabular-nums">
                            {formatVnd(s.totalCashToRemit)}₫
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                            <div>{formatVnd(s.revenue)}₫</div>
                            <div className="text-[11px] font-normal text-gray-400">{s.invoices} bill</div>
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-brand-600 dark:text-brand-400 tabular-nums">
                            {formatVnd(s.salesMemberCreditAmount)}₫
                          </td>
                          <td
                            className={`px-3 py-3 text-right font-bold tabular-nums ${
                              delta >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {delta > 0 ? '+' : ''}
                            {formatVnd(delta)}₫
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenStoreLedger(s.storeId)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition"
                            >
                              Xem thẻ
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-800/80 font-bold border-t-2 border-gray-200 dark:border-gray-700 tabular-nums">
                    <tr>
                      <td className="px-3 py-3" colSpan={2}>
                        Tổng cộng ({filteredStores.length} cửa hàng)
                      </td>
                      <td className="px-3 py-3 text-right">{formatVnd(tableTotals.salesCash)}₫</td>
                      <td className="px-3 py-3 text-right">{formatVnd(tableTotals.salesNonCash)}₫</td>
                      <td className="px-3 py-3 text-right">{formatVnd(tableTotals.topUpCash)}₫</td>
                      <td className="px-3 py-3 text-right">{formatVnd(tableTotals.topUpNonCash)}₫</td>
                      <td className="px-3 py-3 text-right bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                        {formatVnd(tableTotals.totalCashToRemit)}₫
                      </td>
                      <td className="px-3 py-3 text-right text-amber-700 dark:text-amber-400">
                        {formatVnd(tableTotals.topUpRev)}₫ ({tableTotals.topUpInvoices})
                      </td>
                      <td className="px-3 py-3 text-right text-brand-600 dark:text-brand-400">
                        {formatVnd(tableTotals.memberSpent)}₫
                      </td>
                      <td
                        className={`px-3 py-3 text-right ${
                          tableTotals.delta >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tableTotals.delta > 0 ? '+' : ''}
                        {formatVnd(tableTotals.delta)}₫
                      </td>
                      <td className="px-3 py-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Daily Trend Chart */}
          {report.dailyTrend.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xs p-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Xu hướng thực thu nạp thẻ theo ngày
              </h2>
              <div className="space-y-2">
                {report.dailyTrend.map((d, idx) => (
                  <DailyTrendBar key={idx} item={d} max={maxDailyRevenue} formatVnd={formatVnd} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DailyTrendBar({
  item,
  max,
  formatVnd,
}: {
  item: TopUpDailyTrendItem;
  max: number;
  formatVnd: (n: number) => string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((item.revenue / max) * 100)) : 0;
  const dateStr = (() => {
    try {
      return new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return item.date;
    }
  })();

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-12 text-xs text-gray-500 font-medium tabular-nums shrink-0">{dateStr}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-5 overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-28 text-right text-xs font-semibold tabular-nums">
        {formatVnd(item.revenue)}₫
      </span>
      <span className="w-14 text-right text-xs text-gray-400 tabular-nums shrink-0">
        {item.invoices} bill
      </span>
    </div>
  );
}
