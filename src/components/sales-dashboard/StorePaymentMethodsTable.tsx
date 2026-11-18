'use client';

import React, { useMemo, useState } from 'react';
import type { StorePaymentMethodItem } from '@/services/salesDashboard';
import { isMemberPaymentMethod } from './CardSettlementSummaryCard';

interface StorePaymentMethodsTableProps {
  data: StorePaymentMethodItem[];
}

interface UniquePaymentColumn {
  paymentType: number;
  paymentTypeName: string;
  isMember: boolean;
}

const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat('vi-VN').format(value ?? 0);

export function buildStorePaymentMethodsPivotAndDetailSheets(
  storePaymentMethods: StorePaymentMethodItem[],
) {
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
    row['TM Nạp thẻ (VND)'] = s.topUpCashAmount ?? 0;
    row['CK/Khác Nạp thẻ (VND)'] = s.topUpNonCashAmount ?? 0;
    row['Tổng Nạp thẻ (VND)'] = s.topUpTotalAmount ?? 0;
    row['Tổng TM phải nộp (VND)'] = s.totalCashToRemit ?? 0;
    return row;
  });

  const detailRows = storePaymentMethods.flatMap((s) => {
    const salesRows: Record<string, any>[] = s.paymentMethodRevenues.map((p) => ({
      'Cửa hàng': s.storeName,
      Loại: 'Bán hàng',
      'Phương thức': p.paymentTypeName,
      'Số giao dịch': p.transactionCount,
      'Tổng tiền (VND)': p.amount,
    }));

    const topUpCash = s.topUpCashAmount ?? 0;
    const topUpNonCash = s.topUpNonCashAmount ?? 0;

    if (topUpCash > 0) {
      salesRows.push({
        'Cửa hàng': s.storeName,
        Loại: 'Nạp thẻ thu hộ',
        'Phương thức': 'Tiền mặt',
        'Số giao dịch': '—',
        'Tổng tiền (VND)': topUpCash,
      });
    }
    if (topUpNonCash > 0) {
      salesRows.push({
        'Cửa hàng': s.storeName,
        Loại: 'Nạp thẻ thu hộ',
        'Phương thức': 'CK/Khác',
        'Số giao dịch': '—',
        'Tổng tiền (VND)': topUpNonCash,
      });
    }

    return salesRows;
  });

  return [
    {
      name: 'Pivot',
      rows,
      columnWidths: [6, 30, ...allPaymentTypes.map(() => 18), 18, 18, 18, 20],
    },
    {
      name: 'Chi tiết',
      rows: detailRows,
      columnWidths: [30, 16, 24, 14, 18],
    },
  ];
}

export default function StorePaymentMethodsTable({ data }: StorePaymentMethodsTableProps) {
  const [pageSize, setPageSize] = useState<number>(50);

  const paymentMethods = useMemo<UniquePaymentColumn[]>(() => {
    const uniqueMethods = new Map<number, UniquePaymentColumn>();
    data.forEach((store) => {
      store.paymentMethodRevenues?.forEach((pm) => {
        const existing = uniqueMethods.get(pm.paymentType);
        const memberFlag = isMemberPaymentMethod(pm);
        if (!existing) {
          uniqueMethods.set(pm.paymentType, {
            paymentType: pm.paymentType,
            paymentTypeName: pm.paymentTypeName,
            isMember: memberFlag,
          });
        } else if (memberFlag && !existing.isMember) {
          existing.isMember = true;
        }
      });
    });

    return Array.from(uniqueMethods.values()).sort((a, b) =>
      a.paymentTypeName.localeCompare(b.paymentTypeName),
    );
  }, [data]);

  const getPaymentAmount = (row: StorePaymentMethodItem, paymentType: number): number => {
    const payment = row.paymentMethodRevenues?.find((p) => p.paymentType === paymentType);
    return payment?.amount ?? 0;
  };

  const totals = useMemo(() => {
    const byPaymentType = new Map<number, number>();
    let topUpCash = 0;
    let topUpNonCash = 0;
    let topUpTotal = 0;
    let totalCashToRemit = 0;

    for (const row of data) {
      for (const pm of row.paymentMethodRevenues ?? []) {
        byPaymentType.set(pm.paymentType, (byPaymentType.get(pm.paymentType) ?? 0) + (pm.amount ?? 0));
      }
      topUpCash += row.topUpCashAmount ?? 0;
      topUpNonCash += row.topUpNonCashAmount ?? 0;
      topUpTotal += row.topUpTotalAmount ?? 0;
      totalCashToRemit += row.totalCashToRemit ?? 0;
    }

    return {
      byPaymentType,
      topUpCash,
      topUpNonCash,
      topUpTotal,
      totalCashToRemit,
    };
  }, [data]);

  const visibleData = data.slice(0, pageSize);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
          </select>
          <span>dòng</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Cột bán hàng tách riêng với thu hộ Nạp thẻ; Tổng TM phải nộp = TM Bán + TM Nạp thẻ
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-[#389e4d] text-white font-semibold">
              <th className="px-4 py-3.5 text-center w-16 rounded-tl-md">STT</th>
              <th className="px-4 py-3.5 min-w-[200px]">Cửa hàng</th>
              {paymentMethods.map((payment) => (
                <th key={payment.paymentType} className="px-4 py-3.5 text-right whitespace-nowrap">
                  <div>{payment.paymentTypeName}</div>
                  {payment.isMember && (
                    <div className="text-[11px] font-normal text-emerald-100">
                      (Cty trả lại CH)
                    </div>
                  )}
                </th>
              ))}
              <th className="px-4 py-3.5 text-right whitespace-nowrap bg-[#2f8841]">
                TM Nạp thẻ
              </th>
              <th className="px-4 py-3.5 text-right whitespace-nowrap bg-[#2f8841]">
                CK/Khác Nạp thẻ
              </th>
              <th className="px-4 py-3.5 text-right whitespace-nowrap bg-[#2f8841]">
                Tổng Nạp thẻ
              </th>
              <th className="px-4 py-3.5 text-right whitespace-nowrap bg-[#236f33] rounded-tr-md">
                Tổng TM phải nộp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
            {visibleData.map((row, index) => (
              <tr
                key={row.storeId || index}
                className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
              >
                <td className="px-4 py-3.5 text-center font-medium text-gray-600 dark:text-gray-400 tabular-nums">
                  {index + 1}
                </td>
                <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                  {row.storeName}
                </td>
                {paymentMethods.map((payment) => (
                  <td
                    key={payment.paymentType}
                    className={`px-4 py-3.5 text-right tabular-nums ${
                      payment.isMember
                        ? 'font-semibold text-brand-600 dark:text-brand-400'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {formatNumber(getPaymentAmount(row, payment.paymentType))}
                  </td>
                ))}
                <td className="px-4 py-3.5 text-right text-amber-700 dark:text-amber-400 tabular-nums">
                  {formatNumber(row.topUpCashAmount ?? 0)}
                </td>
                <td className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                  {formatNumber(row.topUpNonCashAmount ?? 0)}
                </td>
                <td className="px-4 py-3.5 text-right font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                  {formatNumber(row.topUpTotalAmount ?? 0)}
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 tabular-nums">
                  {formatNumber(row.totalCashToRemit ?? 0)}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={paymentMethods.length + 6}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  Không có dữ liệu cửa hàng nào trong khoảng thời gian này.
                </td>
              </tr>
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-t-2 border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white">
                <td className="px-4 py-3.5 text-center" colSpan={2}>
                  Tổng cộng ({data.length} cửa hàng)
                </td>
                {paymentMethods.map((payment) => (
                  <td
                    key={payment.paymentType}
                    className={`px-4 py-3.5 text-right tabular-nums ${
                      payment.isMember ? 'text-brand-600 dark:text-brand-400' : ''
                    }`}
                  >
                    {formatNumber(totals.byPaymentType.get(payment.paymentType) ?? 0)}
                  </td>
                ))}
                <td className="px-4 py-3.5 text-right text-amber-700 dark:text-amber-400 tabular-nums">
                  {formatNumber(totals.topUpCash)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums">
                  {formatNumber(totals.topUpNonCash)}
                </td>
                <td className="px-4 py-3.5 text-right text-amber-700 dark:text-amber-400 tabular-nums">
                  {formatNumber(totals.topUpTotal)}
                </td>
                <td className="px-4 py-3.5 text-right text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 tabular-nums">
                  {formatNumber(totals.totalCashToRemit)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
