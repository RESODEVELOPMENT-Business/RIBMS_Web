'use client';

import React from 'react';
import { TrendBucket } from '@/services/salesDashboard';

interface Props {
  buckets: TrendBucket[];
  granularity: string;
}

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

/**
 * Lightweight column chart for the dashboard trend section. Built without bringing
 * in apexcharts here so the page payload stays small — the existing apexcharts is
 * still available globally for richer charts elsewhere.
 */
export default function TrendChart({ buckets, granularity }: Props) {
  if (!buckets.length) return null;
  const max = buckets.reduce((m, b) => Math.max(m, b.revenue), 0);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Trend doanh thu ({granularity})</h2>
        <span className="text-xs text-gray-400">
          Cột cao nhất: {formatVND(max)}
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex items-end gap-2 min-h-[200px] min-w-max pb-2">
          {buckets.map((b) => {
            const ratio = max > 0 ? (b.revenue / max) * 100 : 0;
            const heightPct = b.revenue > 0 ? Math.max(ratio, 4) : 0;
            return (
              <div key={`${b.bucketStart}-${b.label}`}
                   className="flex flex-col items-center gap-1 group min-w-[44px]">
                <div className="text-[10px] text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                  {b.invoiceCount > 0 ? b.invoiceCount : ''}
                </div>
                <div className="w-full h-44 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-brand-500 to-indigo-500 rounded-t-md transition-all duration-300"
                    style={{ height: `${heightPct}%` }}
                    title={`${b.label} — ${formatVND(b.revenue)} (${b.invoiceCount} bill)`}
                  />
                </div>
                <div className="text-[10px] text-gray-500 whitespace-nowrap">{b.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
