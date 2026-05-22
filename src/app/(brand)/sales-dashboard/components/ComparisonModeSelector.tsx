'use client';

import React from 'react';
import { ComparisonMode } from '@/services/salesDashboard';

interface Props {
  value: ComparisonMode;
  onChange: (mode: ComparisonMode) => void;
}

const MODES: { code: ComparisonMode; label: string; tooltip: string }[] = [
  { code: 'Auto', label: 'Tự động', tooltip: 'Lùi cùng độ dài range' },
  { code: 'DoD', label: 'DoD', tooltip: 'Hôm nay vs hôm qua' },
  { code: 'WoW', label: 'WoW', tooltip: 'Tuần này vs tuần trước (lùi 7 ngày)' },
  { code: 'MoM', label: 'MoM', tooltip: 'Tháng này vs tháng trước' },
  { code: 'YoY', label: 'YoY', tooltip: 'Năm này vs năm trước' },
];

export default function ComparisonModeSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        So sánh kỳ trước
      </label>
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.code}
            type="button"
            title={m.tooltip}
            onClick={() => onChange(m.code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              value === m.code
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
