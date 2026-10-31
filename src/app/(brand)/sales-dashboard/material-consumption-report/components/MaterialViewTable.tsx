'use client';

import React, { useState } from 'react';
import { MaterialConsumptionItem } from '@/types/materialReport';
import { ChevronDownIcon } from '@/icons';

interface MaterialViewTableProps {
  items: MaterialConsumptionItem[];
}

export default function MaterialViewTable({ items }: MaterialViewTableProps) {
  const [expandedItemIds, setExpandedItemIds] = useState<Set<number>>(new Set());

  const toggleExpand = (itemId: number) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedItemIds(new Set(items.map((x) => x.itemId)));
  };

  const collapseAll = () => {
    setExpandedItemIds(new Set());
  };

  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center text-xs text-gray-400">
        Không có dữ liệu trong khoảng thời gian đã chọn.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Table control bar */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Tổng cộng: {items.length} vật tư</span>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="hover:text-brand-500 transition underline underline-offset-2"
          >
            Mở rộng tất cả
          </button>
          <span>•</span>
          <button
            onClick={collapseAll}
            className="hover:text-brand-500 transition underline underline-offset-2"
          >
            Thu gọn tất cả
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="py-3 px-4 w-10 text-center"></th>
                <th className="py-3 px-4">Mã VT</th>
                <th className="py-3 px-4">Tên vật tư</th>
                <th className="py-3 px-4 text-center">ĐVT</th>
                <th className="py-3 px-4 text-right">Đã nhập</th>
                <th className="py-3 px-4 text-right">Tiêu hao</th>
                <th className="py-3 px-4 text-right">Chênh lệch</th>
                <th className="py-3 px-4 text-right">% Hao hụt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => {
                const isExpanded = expandedItemIds.has(item.itemId);
                const hasInward = item.totalInward > 0;
                const isOverConsumed = hasInward && item.totalConsumedPackage > item.totalInward;

                const primaryUnit = item.unit || 'ĐV';
                const subUnit = item.unit2 || '';

                return (
                  <React.Fragment key={item.itemId}>
                    <tr
                      onClick={() => toggleExpand(item.itemId)}
                      className={`cursor-pointer transition hover:bg-gray-50/80 dark:hover:bg-gray-800/50 ${
                        isExpanded ? 'bg-gray-50/60 dark:bg-gray-800/40' : ''
                      }`}
                    >
                      {/* Expand Toggle */}
                      <td className="py-3 px-4 text-center text-gray-400">
                        <ChevronDownIcon
                          className={`w-3.5 h-3.5 mx-auto transition-transform duration-200 ${
                            isExpanded ? '' : '-rotate-90'
                          }`}
                        />
                      </td>

                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-medium text-gray-600 dark:text-gray-300">
                        {item.itemCode || '—'}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        {item.itemName}
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-[11px]">
                          {primaryUnit}
                        </span>
                        {subUnit && item.unitRate > 1 && (
                          <span className="block text-[10px] text-gray-400 mt-0.5">
                            1 = {item.unitRate} {subUnit}
                          </span>
                        )}
                      </td>

                      {/* Inward */}
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                        {item.totalInward > 0 ? (
                          <span>
                            {item.totalInward.toLocaleString('vi-VN')} {primaryUnit}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>

                      {/* Theoretical Consumption */}
                      <td className="py-3 px-4 text-right font-semibold text-brand-600 dark:text-brand-400">
                        <div>
                          {item.totalConsumedPackage.toLocaleString('vi-VN', {
                            maximumFractionDigits: 2,
                          })}{' '}
                          {primaryUnit}
                        </div>
                        {subUnit && item.unitRate > 1 && (
                          <div className="text-[11px] font-normal text-gray-400">
                            ({item.totalConsumedBase.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}{' '}
                            {subUnit})
                          </div>
                        )}
                      </td>

                      {/* Variance */}
                      <td className="py-3 px-4 text-right font-medium">
                        {hasInward ? (
                          <span
                            className={
                              isOverConsumed
                                ? 'text-red-500 dark:text-red-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            {item.variance > 0 ? '+' : ''}
                            {item.variance.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}{' '}
                            {primaryUnit}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Variance Rate */}
                      <td className="py-3 px-4 text-right font-medium">
                        {hasInward ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                              isOverConsumed
                                ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            }`}
                          >
                            {item.varianceRate > 0 ? '+' : ''}
                            {item.varianceRate.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Detail Rows: Consuming Products */}
                    {isExpanded && (
                      <tr className="bg-gray-50/40 dark:bg-gray-800/20">
                        <td colSpan={8} className="py-3 px-6">
                          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 space-y-2">
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              Các món tiêu thụ ({item.consumingProducts.length} món):
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {item.consumingProducts.map((p, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                                >
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                      {p.productName}
                                      {p.isAddition && (
                                        <span className="text-[10px] px-1 py-0.2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                          Topping
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      {p.quantitySold.toLocaleString('vi-VN')} ly × {p.quantityPerCup}{' '}
                                      {subUnit || primaryUnit}/ly
                                    </div>
                                  </div>
                                  <div className="text-right font-medium text-gray-800 dark:text-gray-200">
                                    {p.totalConsumedBase.toLocaleString('vi-VN', {
                                      maximumFractionDigits: 1,
                                    })}{' '}
                                    <span className="text-[10px] text-gray-400">
                                      {subUnit || primaryUnit}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
