'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Simplified hook for store-level sales dashboard pages.
 * Unlike the brand hook, this gets the storeId directly from auth
 * (no store-selector dropdown needed).
 */
export function useStoreDashboardFilters(initialDays = 0) {
  const storeId = useAuthStore((state) => state.user?.adminStoreId);

  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - initialDays);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0],
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
