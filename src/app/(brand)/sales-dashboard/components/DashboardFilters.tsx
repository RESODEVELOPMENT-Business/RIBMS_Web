'use client';

import React from 'react';
import DatePicker from '@/components/form/date-picker';

export interface DashboardFiltersProps {
  stores: any[];
  storesLoading: boolean;
  selectedStoreId: number | '';
  fromDate: string;
  toDate: string;
  onStoreChange: (id: number | '') => void;
  onDateRangeChange: (from: string, to: string) => void;
  /** unique id used by flatpickr (multiple pages can mount the same filter). */
  datePickerId: string;
}

const PRESETS: { label: string; days: number }[] = [
  { label: 'Hôm nay', days: 0 },
  { label: '3 ngày qua', days: 3 },
  { label: '7 ngày qua', days: 7 },
  { label: '30 ngày qua', days: 30 },
];

export default function DashboardFilters({
  stores,
  storesLoading,
  selectedStoreId,
  fromDate,
  toDate,
  onStoreChange,
  onDateRangeChange,
  datePickerId,
}: DashboardFiltersProps) {
  const dateRange = `${fromDate} to ${toDate}`;

  const handleDateRangeChange = React.useCallback(
    (selectedDates: Date[], dateStr: string) => {
      // Only apply when the picker produced a range string or two+ dates.
      if (dateStr.includes(' to ') || selectedDates.length >= 2) {
        const parts = dateStr.split(' to ');
        const from = parts[0];
        const to = parts[1] || parts[0];

        if (from) onDateRangeChange(from, to || from);
      }
    },
    [onDateRangeChange],
  );

  const applyPreset = (days: number) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);
    onDateRangeChange(
      start.toISOString().split('T')[0],
      today.toISOString().split('T')[0],
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-xl shadow-gray-100/50 dark:shadow-none space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Cửa Hàng
          </label>
          <select
            value={selectedStoreId}
            onChange={(e) =>
              onStoreChange(e.target.value === '' ? '' : Number(e.target.value))
            }
            disabled={storesLoading}
            className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none disabled:opacity-50"
          >
            {storesLoading ? (
              <option value="">Đang tải cửa hàng...</option>
            ) : (
              <>
                <option value="">Tất cả cửa hàng (Toàn hệ thống)</option>
                {stores.map((s) => (
                  <option key={s.id || s.storeId} value={s.id || s.storeId}>
                    {s.name || s.storeName}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Khoảng Thời Gian
          </label>
          <DatePicker
            id={datePickerId}
            mode="range"
            defaultDate={dateRange}
            onChange={handleDateRangeChange}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800/80">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.days)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
