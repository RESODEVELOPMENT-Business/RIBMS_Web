'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { getStores } from '@/services/stores';
import { getStorePaymentMethods, StorePaymentMethodItem } from '@/services/salesDashboard';
import {
  DownloadIcon,
  CalenderIcon
} from '@/icons';
import DatePicker from '@/components/form/date-picker';
import StorePaymentMethodsTable from '../components/StorePaymentMethodsTable';

export default function StorePaymentMethodsPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('');

  // Date filters (defaults: from 7 days ago to today)
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [storePaymentMethods, setStorePaymentMethods] = useState<StorePaymentMethodItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [storesLoading, setStoresLoading] = useState<boolean>(true);

  // Create a joined string for flatpickr range format
  const dateRange = `${fromDate} to ${toDate}`;

  // Memoize onChange handler
  const handleDateRangeChange = React.useCallback((selectedDates: Date[], dateStr: string) => {
    if (selectedDates.length === 2) {
      const parts = dateStr.split(' to ');
      if (parts.length === 2) {
        setFromDate(parts[0]);
        setToDate(parts[1]);
      }
    }
  }, []);

  const handlePreset = (days: number) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);

    setFromDate(start.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
  };

  // Load stores first
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

  // Fetch store payment methods when store or dates change
  useEffect(() => {
    if (!storesLoading) {
      fetchData();
    }
  }, [selectedStoreId, fromDate, toDate, storesLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let brandIdToUse = useAuthStore.getState().user?.brandId;
      if (!brandIdToUse && stores.length > 0) {
        brandIdToUse = stores[0].brandId || stores[0].BrandId;
      }

      const res = await getStorePaymentMethods(
        selectedStoreId ? Number(selectedStoreId) : null,
        brandIdToUse || null,
        fromDate,
        toDate,
      );

      if (res && res.data) {
        setStorePaymentMethods(res.data);
      } else {
        setStorePaymentMethods([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch store payment methods:', err);
      toast.error(err.message || 'Không thể tải dữ liệu doanh thu theo thanh toán');
      setStorePaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Doanh Thu Theo Thanh Toán
          </h1>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-xl shadow-gray-100/50 dark:shadow-none space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Store Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Cửa Hàng
            </label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value === '' ? '' : Number(e.target.value))}
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

          {/* Date Range Picker */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Khoảng Thời Gian
            </label>
            <DatePicker
              id="store-payment-methods-date-range"
              mode="range"
              defaultDate={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>
        </div>

        {/* Presets Row */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800/80">
          <button
            type="button"
            onClick={() => handlePreset(0)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => handlePreset(3)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            3 ngày qua
          </button>
          <button
            type="button"
            onClick={() => handlePreset(7)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => handlePreset(30)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            30 ngày qua
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold animate-pulse">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/30 dark:shadow-none p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-500">Chi Tiết Hình Thức Thanh Toán</h2>
                <p className="text-sm text-gray-500 font-medium mt-1">Tính đến {new Date().toLocaleTimeString('vi-VN')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors">
                  Hôm nay <CalenderIcon className="w-4 h-4 text-brand-500" />
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors">
                  <DownloadIcon className="w-4 h-4" /> XUẤT RA FILE EXCEL
                </button>
              </div>
            </div>

            <StorePaymentMethodsTable data={storePaymentMethods} />
          </div>
        </div>
      )}
    </div>
  );
}
