'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getMemberCardLedger,
  MemberCardLedgerCategory,
  MemberCardLedgerData,
} from '@/services/salesDashboard';

interface StoreOption {
  id?: number;
  storeId?: number;
  name?: string;
  storeName?: string;
}

interface MemberCardLedgerTabProps {
  scope: 'brand' | 'store';
  brandId?: number | null;
  lockedStoreId?: number | null;
  stores?: StoreOption[];
  parentStoreIds?: number[];
  fromDate: string;
  toDate: string;
  selectedDrilldownStoreId: number | null;
  onSelectDrilldownStoreId: (storeId: number | null) => void;
}

const CATEGORY_META: Record<
  string,
  { label: string; badgeClass: string }
> = {
  topup: {
    label: 'Nạp thẻ',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  spend: {
    label: 'Tiêu thẻ',
    badgeClass: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800',
  },
  topup_cancel: {
    label: 'Hủy nạp thẻ',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  order_refund: {
    label: 'Hoàn tiền hủy đơn',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  },
};

export default function MemberCardLedgerTab({
  scope,
  brandId,
  lockedStoreId,
  stores = [],
  parentStoreIds = [],
  fromDate,
  toDate,
  selectedDrilldownStoreId,
  onSelectDrilldownStoreId,
}: MemberCardLedgerTabProps) {
  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [category, setCategory] = useState<MemberCardLedgerCategory>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [ledger, setLedger] = useState<MemberCardLedgerData | null>(null);
  const [loading, setLoading] = useState(false);

  const formatVnd = (n: number | null | undefined) =>
    new Intl.NumberFormat('vi-VN').format(n ?? 0);

  const formatDateTime = (d: string) => {
    try {
      return new Date(d).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return d;
    }
  };

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, selectedDrilldownStoreId, lockedStoreId, category, submittedSearch, parentStoreIds]);

  useEffect(() => {
    if (scope === 'store' && !lockedStoreId) return;
    if (scope === 'brand' && !brandId && parentStoreIds.length === 0) return;

    let cancelled = false;
    const loadLedger = async () => {
      setLoading(true);
      try {
        const effectiveStoreId =
          scope === 'store'
            ? lockedStoreId
            : selectedDrilldownStoreId;
        const effectiveStoreIds =
          scope === 'brand' && !selectedDrilldownStoreId && parentStoreIds.length > 0
            ? parentStoreIds
            : null;

        const res = await getMemberCardLedger({
          storeId: effectiveStoreId,
          storeIds: effectiveStoreIds,
          brandId: scope === 'brand' ? (brandId || null) : null,
          fromDate,
          toDate,
          search: submittedSearch || undefined,
          category,
          page,
          pageSize,
        });

        if (!cancelled) {
          setLedger(res?.data ?? null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to fetch member card ledger:', err);
          toast.error(err.message || 'Không thể tải lịch sử giao dịch thẻ thành viên');
          setLedger(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadLedger();
    return () => {
      cancelled = true;
    };
  }, [
    scope,
    brandId,
    lockedStoreId,
    selectedDrilldownStoreId,
    parentStoreIds,
    fromDate,
    toDate,
    submittedSearch,
    category,
    page,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(searchInput.trim());
  };

  const handleReset = () => {
    setSearchInput('');
    setSubmittedSearch('');
    setCategory('all');
    if (scope === 'brand') {
      onSelectDrilldownStoreId(null);
    }
    setPage(1);
  };

  const summary = ledger?.summary;
  const items = ledger?.items ?? [];

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-3 lg:items-end"
      >
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Tìm mã thẻ / Tên / SĐT khách hàng
          </label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nhập mã thẻ, SĐT hoặc tên khách..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>

        {scope === 'brand' && (
          <div className="w-full lg:w-64">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Cửa hàng phát sinh
            </label>
            <select
              value={selectedDrilldownStoreId ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                onSelectDrilldownStoreId(val ? Number(val) : null);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="">
                {parentStoreIds.length > 0 ? 'Theo cửa hàng đang lọc' : 'Tất cả cửa hàng'}
              </option>
              {stores.map((s) => {
                const id = s.id ?? s.storeId;
                const name = s.name ?? s.storeName;
                if (!id) return null;
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div className="w-full lg:w-52">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Loại giao dịch
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MemberCardLedgerCategory)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          >
            <option value="all">Tất cả giao dịch</option>
            <option value="topup">Nạp thẻ</option>
            <option value="spend">Tiêu thẻ</option>
            <option value="topup_cancel">Hủy nạp thẻ</option>
            <option value="order_refund">Hoàn tiền hủy đơn</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Đặt lại
          </button>
        </div>
      </form>

      {/* Single-Card Audit Banner */}
      {summary?.matchedCardCode && (
        <div className="bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Hồ sơ thẻ khớp tìm kiếm
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span className="text-base font-bold text-gray-900 dark:text-white font-mono">
                {summary.matchedCardCode}
              </span>
              {summary.matchedCustomerName && (
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {summary.matchedCustomerName}
                  {summary.matchedCustomerPhone ? ` (${summary.matchedCustomerPhone})` : ''}
                </span>
              )}
            </div>
          </div>
          {summary.matchedCardCurrentBalance != null && (
            <div className="text-left md:text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Số dư thẻ hiện tại</p>
              <p className="text-xl font-extrabold text-brand-600 dark:text-brand-400 tabular-nums">
                {formatVnd(summary.matchedCardCurrentBalance)}₫
              </p>
            </div>
          )}
        </div>
      )}

      {/* Period Summary Strip */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <MiniStat label="Số giao dịch" value={`${formatVnd(summary.totalCount)}`} />
          <MiniStat label="Nạp thẻ (+)" value={`+${formatVnd(summary.totalTopUpAmount)}₫`} tone="emerald" />
          <MiniStat label="Tiêu thẻ (-)" value={`-${formatVnd(summary.totalSpendAmount)}₫`} tone="brand" />
          <MiniStat label="Hủy nạp (-)" value={`-${formatVnd(summary.totalTopUpCancelAmount)}₫`} tone="amber" />
          <MiniStat label="Hoàn đơn POS (+)" value={`+${formatVnd(summary.totalOrderRefundAmount)}₫`} tone="purple" />
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Đang tải lịch sử giao dịch thẻ...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
            Không có giao dịch thẻ thành viên nào khớp bộ lọc trong khoảng ngày này.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Thời gian</th>
                    <th className="px-4 py-3 text-left">Mã thẻ</th>
                    <th className="px-4 py-3 text-left">Khách hàng</th>
                    <th className="px-4 py-3 text-left">Cửa hàng</th>
                    <th className="px-4 py-3 text-left">Loại GD</th>
                    <th className="px-4 py-3 text-right">Biến động</th>
                    <th className="px-4 py-3 text-right">Số dư hiện tại</th>
                    <th className="px-4 py-3 text-left">Mã GD / Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item) => {
                    const meta = CATEGORY_META[item.category] ?? {
                      label: item.category,
                      badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
                    };
                    return (
                      <tr key={item.transactionId} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300 tabular-nums">
                          {formatDateTime(item.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-800 dark:text-gray-200">
                          {item.cardCode || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800 dark:text-gray-100">
                            {item.customerName || '-'}
                          </div>
                          {item.customerPhone && (
                            <div className="text-xs text-gray-500 tabular-nums">{item.customerPhone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.storeName}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${meta.badgeClass}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold whitespace-nowrap tabular-nums ${
                            item.isIncreaseTransaction
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {item.isIncreaseTransaction ? '+' : '-'}
                          {formatVnd(item.amount)}₫
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap text-gray-700 dark:text-gray-200 tabular-nums">
                          {item.accountCurrentBalance != null ? `${formatVnd(item.accountCurrentBalance)}₫` : '-'}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {item.transactionCode && (
                            <div className="text-xs font-mono text-gray-500 truncate" title={item.transactionCode}>
                              {item.transactionCode}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-xs text-gray-600 dark:text-gray-300 truncate" title={item.notes}>
                              {item.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {ledger && ledger.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-300">
                <span>
                  Trang <strong className="tabular-nums">{ledger.page}</strong> /{' '}
                  <strong className="tabular-nums">{ledger.totalPages}</strong> ({formatVnd(ledger.totalCount)} dòng)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={page >= ledger.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = 'gray',
}: {
  label: string;
  value: string;
  tone?: 'gray' | 'emerald' | 'brand' | 'amber' | 'purple';
}) {
  const toneText: Record<string, string> = {
    gray: 'text-gray-900 dark:text-white',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    brand: 'text-brand-600 dark:text-brand-400',
    amber: 'text-amber-600 dark:text-amber-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 shadow-xs">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-base font-bold mt-0.5 tabular-nums ${toneText[tone]}`}>{value}</p>
    </div>
  );
}
