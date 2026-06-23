'use client';

import React from 'react';
import { TrendGranularity } from '@/services/salesDashboard';

interface Props {
  value: TrendGranularity;
  onChange: (g: TrendGranularity) => void;
}

const OPTIONS: { code: TrendGranularity; label: string; tip: string }[] = [
  { code: 'Day', label: 'Ngày', tip: 'Mỗi cột là 1 ngày' },
  { code: 'Week', label: 'Tuần', tip: 'Tuần ISO, bắt đầu thứ 2' },
  { code: 'Month', label: 'Tháng', tip: 'Mỗi cột là 1 tháng dương lịch' },
  { code: 'Year', label: 'Năm', tip: 'Mỗi cột là 1 năm dương lịch' },
];

export default function TrendGranularitySelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        Trend doanh thu
      </label>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.code}
            type="button"
            title={o.tip}
            onClick={() => onChange(o.code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              value === o.code
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
