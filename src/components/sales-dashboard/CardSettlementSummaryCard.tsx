'use client';

import React from 'react';
import type { CardSettlementSection } from '@/services/salesDashboard';

export function isMemberPaymentMethod(pm: {
  paymentType: number;
  paymentTypeName: string;
  isMember?: boolean;
}): boolean {
  if (pm.isMember) return true;
  if (pm.paymentType === 5) return true;
  const lower = (pm.paymentTypeName || '').toLowerCase();
  return lower.includes('member') || lower.includes('thành viên');
}

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);

interface CardSettlementSummaryCardProps {
  settlement?: CardSettlementSection | null;
  cardTopUpInvoices?: number;
  isShiftView?: boolean;
}

export default function CardSettlementSummaryCard({
  settlement,
  cardTopUpInvoices = 0,
  isShiftView = false,
}: CardSettlementSummaryCardProps) {
  if (!settlement) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {isShiftView
              ? 'Thu hộ Nạp thẻ & Tiền mặt phải nộp cuối ca'
              : 'Thu hộ Nạp thẻ & Đối soát Tiền mặt phải nộp'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Tiền nạp thẻ là tiền thu hộ (không tính vào doanh thu bán hàng); tiền tiêu Thẻ thành viên do công ty bù trả lại cửa hàng.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg inline-block">
            Tổng TM phải nộp = TM Bán + TM Nạp thẻ
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Tiền mặt bán hàng</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums">
            {formatVND(settlement.salesCashAmount)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
          <p className="text-xs text-amber-800 dark:text-amber-300">Tiền mặt thu hộ nạp thẻ</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1 tabular-nums">
            {formatVND(settlement.topUpCashAmount)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            Tổng tiền mặt phải nộp công ty
          </p>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
            {formatVND(settlement.totalCashToRemit)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">CK / Khác thu hộ nạp thẻ</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums">
            {formatVND(settlement.topUpNonCashAmount)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tổng thu hộ nạp thẻ ({cardTopUpInvoices} bill)
          </p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1 tabular-nums">
            {formatVND(settlement.topUpTotalAmount)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40">
          <p className="text-xs text-brand-700 dark:text-brand-300">
            Khách tiêu Thẻ TV (Cty bù trả CH)
          </p>
          <p className="text-xl font-bold text-brand-600 dark:text-brand-400 mt-1 tabular-nums">
            {formatVND(settlement.memberCreditSpentAmount)}
          </p>
        </div>
      </div>

      {((settlement.topUpUnclassifiedInvoices ?? 0) > 0 ||
        (settlement.topUpUnclassifiedAmount ?? 0) > 0) && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
          <span>
            Cảnh báo: Có{' '}
            <strong>{settlement.topUpUnclassifiedInvoices ?? 0}</strong> đơn nạp
            thẻ thiếu dữ liệu phương thức thanh toán — chưa phân loại vào Tiền
            mặt hay CK/Khác.
          </span>
          <strong className="tabular-nums whitespace-nowrap">
            {formatVND(settlement.topUpUnclassifiedAmount ?? 0)}
          </strong>
        </div>
      )}
    </div>
  );
}
