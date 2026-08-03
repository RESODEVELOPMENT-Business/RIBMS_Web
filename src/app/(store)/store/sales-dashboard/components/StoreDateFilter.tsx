'use client';

import React, { useCallback } from 'react';
import DatePicker from '@/components/form/date-picker';
import { COMMON_PRESETS, getPresetDateRange } from '@/lib/vietnamDate';

interface StoreDateFilterProps {
  fromDate: string;
  toDate: string;
  onDateRangeChange: (from: string, to: string) => void;
  datePickerId: string;
  hideDateRange?: boolean;
}

const PRESETS = COMMON_PRESETS;

/**
 * Simplified date-only filter bar for store-level dashboard pages.
 * No store selector needed since storeId comes from auth.
 */
export default function StoreDateFilter({
  fromDate,
  toDate,
  onDateRangeChange,
  datePickerId,
  hideDateRange = false,
}: StoreDateFilterProps) {
  const dateRange = `${fromDate} to ${toDate}`;

  const handleDateRangeChange = useCallback(
    (selectedDates: Date[], dateStr: string) => {
      if (dateStr.includes(' to ') || selectedDates.length >= 2) {
        const parts = dateStr.split(' to ');
        const from = parts[0];
        const to = parts[1] || parts[0];
        if (from) onDateRangeChange(from, to || from);
      }
    },
    [onDateRangeChange],
  );

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    const { fromDate, toDate } = getPresetDateRange(preset.type);
    onDateRangeChange(fromDate, toDate);
  };

  if (hideDateRange) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-xl shadow-gray-100/50 dark:shadow-none space-y-4">
      <div className="flex flex-col gap-1.5">
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

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800/80">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
