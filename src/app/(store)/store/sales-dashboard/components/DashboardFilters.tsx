'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import DatePicker from '@/components/form/date-picker';
import { ChevronDownIcon, ChevronUpIcon } from '@/icons';
import { COMMON_PRESETS, getPresetDateRange } from '@/lib/vietnamDate';

export interface DashboardFiltersProps {
  stores: any[];
  storesLoading: boolean;
  selectedStoreId?: number | '';
  selectedStoreIds?: number[];
  fromDate: string;
  toDate: string;
  onStoreChange?: (id: number | '') => void;
  onStoreIdsChange?: (ids: number[]) => void;
  onDateRangeChange: (from: string, to: string) => void;
  /** unique id used by flatpickr (multiple pages can mount the same filter). */
  datePickerId: string;
  multiSelect?: boolean;
  /** Hide the date-range picker + presets (for reports that always use the current month). */
  hideDateRange?: boolean;
}

const PRESETS = COMMON_PRESETS;

export default function DashboardFilters({
  stores,
  storesLoading,
  selectedStoreId,
  selectedStoreIds = [],
  fromDate,
  toDate,
  onStoreChange,
  onStoreIdsChange,
  onDateRangeChange,
  datePickerId,
  multiSelect = false,
  hideDateRange = false,
}: DashboardFiltersProps) {
  const dateRange = `${fromDate} to ${toDate}`;

  const handleDateRangeChange = useCallback(
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

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    const { fromDate, toDate } = getPresetDateRange(preset.type);
    onDateRangeChange(fromDate, toDate);
  };

  // State & Ref for Multi-select dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClose = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [dropdownOpen]);

  const filteredStores = stores.filter((s) => {
    const name = (s.name || s.storeName || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-xl shadow-gray-100/50 dark:shadow-none space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Store Selection */}
        <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Cửa Hàng
          </label>
          
          {multiSelect ? (
            <>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={storesLoading}
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none disabled:opacity-50 flex items-center justify-between text-left h-[42px]"
              >
                <span className="truncate pr-2">
                  {storesLoading
                    ? 'Đang tải cửa hàng...'
                    : selectedStoreIds.length === 0
                      ? 'Tất cả cửa hàng (Toàn hệ thống)'
                      : `Đang chọn ${selectedStoreIds.length} cửa hàng`}
                </span>
                {dropdownOpen ? (
                  <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute top-[100%] left-0 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Tìm kiếm cửa hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                  />

                  <div className="flex justify-between items-center text-[11px] font-bold pb-2 border-b border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => onStoreIdsChange?.([])}
                      className="text-brand-600 dark:text-brand-400 hover:opacity-85 transition-opacity font-bold"
                    >
                      Chọn tất cả (Toàn hệ thống)
                    </button>
                    {selectedStoreIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onStoreIdsChange?.([])}
                        className="text-rose-500 hover:text-rose-600 transition-colors font-bold"
                      >
                        Bỏ chọn tất cả
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {filteredStores.map((s) => {
                      const storeId = s.id || s.storeId;
                      const storeName = s.name || s.storeName;
                      const isSelected = selectedStoreIds.includes(storeId);
                      return (
                        <label
                          key={storeId}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer select-none text-xs font-medium transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (!onStoreIdsChange) return;
                              if (isSelected) {
                                onStoreIdsChange(selectedStoreIds.filter((id) => id !== storeId));
                              } else {
                                onStoreIdsChange([...selectedStoreIds, storeId]);
                              }
                            }}
                            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                          />
                          <span className={isSelected ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-gray-700 dark:text-gray-300'}>
                            {storeName}
                          </span>
                        </label>
                      );
                    })}
                    {filteredStores.length === 0 && (
                      <div className="text-center py-4 text-xs text-gray-400">Không tìm thấy cửa hàng</div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <select
              value={selectedStoreId}
              onChange={(e) =>
                onStoreChange?.(e.target.value === '' ? '' : Number(e.target.value))
              }
              disabled={storesLoading}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none disabled:opacity-50 h-[42px]"
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
          )}
        </div>

        {!hideDateRange && (
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
        )}
      </div>

      {!hideDateRange && (
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
      )}
    </div>
  );
}
