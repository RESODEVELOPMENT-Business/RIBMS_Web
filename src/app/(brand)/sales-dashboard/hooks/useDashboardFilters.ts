'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { getStores } from '@/services/stores';
import { toVietnamDateStr, startOfVietnamDay } from '@/lib/vietnamDate';

/**
 * Shared hook for the sales dashboard pages. Encapsulates:
 *   - loading the brand's stores
 *   - selectedStoreId / fromDate / toDate state
 *   - resolving brandId for "all stores" mode
 *
 * Re-used across BC#1..BC#3 pages so that filters stay consistent and we don't
 * duplicate boilerplate.
 */
export function useDashboardFilters(initialDays = 0) {
  const [stores, setStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState<boolean>(true);
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('');
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);

  const [fromDate, setFromDate] = useState<string>(() => {
    if (initialDays === 0) return toVietnamDateStr(new Date());
    const d = startOfVietnamDay(new Date());
    d.setDate(d.getDate() - (initialDays > 0 ? initialDays - 1 : 0));
    return toVietnamDateStr(d);
  });
  const [toDate, setToDate] = useState<string>(() =>
    toVietnamDateStr(new Date()),
  );

  useEffect(() => {
    const fetchStores = async () => {
      setStoresLoading(true);
      try {
        const brandId = useAuthStore.getState().user?.brandId;
        const res = await getStores(1, 100, brandId || undefined);
        if (res && res.data) {
          const items = res.data.items || res.data;
          setStores(items);
          setSelectedStoreId('');
        }
      } catch (err) {
        console.error('Failed to fetch stores:', err);
        toast.error('Không thể tải danh sách cửa hàng');
      } finally {
        setStoresLoading(false);
      }
    };
    fetchStores();
  }, []);

  const resolveBrandId = (): number | undefined => {
    let brandIdToUse = useAuthStore.getState().user?.brandId;
    if (!brandIdToUse && stores.length > 0) {
      brandIdToUse = stores[0].brandId || stores[0].BrandId;
    }
    return brandIdToUse || undefined;
  };

  const setDateRange = (from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
  };

  return {
    stores,
    storesLoading,
    selectedStoreId,
    setSelectedStoreId,
    selectedStoreIds,
    setSelectedStoreIds,
    fromDate,
    toDate,
    setDateRange,
    resolveBrandId,
  };
}
