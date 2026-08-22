'use client';

import type { LoyaltyProductOption } from '@/services/loyaltyProductContracts';

type BrandProductPickerProps = {
  label: string;
  value: number | null;
  options: LoyaltyProductOption[];
  onChange: (value: number | null) => void;
  disabled?: boolean;
  emptyLabel?: string;
};

const selectClass =
  'mt-2 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-theme-xs transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-800/60';

export function BrandProductPicker({
  label,
  value,
  options,
  onChange,
  disabled = false,
  emptyLabel = 'Chọn sản phẩm',
}: BrandProductPickerProps) {
  return (
    <div>
      <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
        className={selectClass}
        disabled={disabled}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
