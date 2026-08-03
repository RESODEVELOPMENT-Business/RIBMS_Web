'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toVietnamDateStr, startOfVietnamDay } from '@/lib/vietnamDate';

/**
 * Simplified hook for store-level sales dashboard pages.
 * Unlike the brand hook, this gets the storeId directly from auth
 * (no store-selector dropdown needed).
 */
export function useStoreDashboardFilters(initialDays = 0) {
  const storeId = useAuthStore((state) => state.user?.adminStoreId);

  const [fromDate, setFromDate] = useState<string>(() => {
    if (initialDays === 0) return toVietnamDateStr(new Date());
    const d = startOfVietnamDay(new Date());
    d.setDate(d.getDate() - (initialDays > 0 ? initialDays - 1 : 0));
    return toVietnamDateStr(d);
  });
  const [toDate, setToDate] = useState<string>(() =>
    toVietnamDateStr(new Date()),
  );

  const setDateRange = (from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
  };

  return {
    storeId: storeId ? Number(storeId) : null,
    fromDate,
    toDate,
    setDateRange,
  };
}
