'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createPromotion,
  CreatePromotionData,
  CreatePromotionDetailData,
  PROMOTION_TYPE_LABELS,
  GIFT_TYPE_LABELS,
  APPLY_LEVEL_LABELS,
} from '@/services/promotions';
import { getStores } from '@/services/stores';
import { useAuthStore } from '@/store/authStore';

export default function CreatePromotionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [details, setDetails] = useState<CreatePromotionDetailData[]>([{}]);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const brandId = useAuthStore.getState().user?.brandId;
      const res = await getStores(1, 200, brandId || undefined);
      if (res && res.data) {
        setStores(res.data.items || res.data);
      }
    } catch (err) {
      console.error('Failed to load stores', err);
    }
  };

  const toggleStore = (storeId: number) => {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  const addDetail = () => setDetails((prev) => [...prev, {}]);
  const removeDetail = (index: number) =>
    setDetails((prev) => prev.filter((_, i) => i !== index));

  const updateDetail = (index: number, field: string, value: any) => {
    setDetails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);

    const payload: CreatePromotionData = {
      promotionCode: fd.get('promotionCode') as string,
      promotionName: fd.get('promotionName') as string,
      promotionClassName: (fd.get('promotionClassName') as string) || undefined,
      shortDescription: (fd.get('shortDescription') as string) || undefined,
      description: (fd.get('description') as string) || undefined,
      imageUrl: (fd.get('imageUrl') as string) || undefined,
      applyLevel: Number(fd.get('applyLevel')),
      giftType: Number(fd.get('giftType')),
      promotionType: Number(fd.get('promotionType')),
      isForMember: fd.get('isForMember') === 'on',
      fromDate: new Date(fd.get('fromDate') as string).toISOString(),
      toDate: new Date(fd.get('toDate') as string).toISOString(),
      applyFromTime: fd.get('applyFromTime') ? Number(fd.get('applyFromTime')) : undefined,
      applyToTime: fd.get('applyToTime') ? Number(fd.get('applyToTime')) : undefined,
      storeIds: selectedStoreIds,
      details: details.filter(
        (d) => d.promotionDetailCode || d.discountRate || d.discountAmount || d.giftProductCode
      ),
    };

    try {
      await createPromotion(payload);
      toast.success('Promotion created successfully!');
      router.push('/promotions');
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Shared input classes ─── */
  const inputCls = 'w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-colors';
  const labelCls = 'block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Create New Promotion</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Section: Basic Information ── */}
        <div className="p-6 bg-white rounded-xl shadow dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Promotion Code *</label>
              <input required name="promotionCode" className={inputCls} placeholder="e.g. SUMMER2026" />
            </div>
            <div>
              <label className={labelCls}>Promotion Name *</label>
              <input required name="promotionName" className={inputCls} placeholder="Summer Sale 2026" />
            </div>
            <div>
              <label className={labelCls}>Class Name</label>
              <input name="promotionClassName" className={inputCls} placeholder="Optional class" />
            </div>
            <div>
              <label className={labelCls}>Image URL</label>
              <input name="imageUrl" type="url" className={inputCls} placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Short Description</label>
              <input name="shortDescription" className={inputCls} placeholder="Brief summary" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea name="description" rows={3} className={inputCls} placeholder="Full description…" />
            </div>
          </div>
        </div>

        {/* ── Section: Configuration ── */}
        <div className="p-6 bg-white rounded-xl shadow dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Promotion Type *</label>
              <select required name="promotionType" className={inputCls}>
                {Object.entries(PROMOTION_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Gift Type *</label>
              <select required name="giftType" className={inputCls}>
                {Object.entries(GIFT_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Apply Level *</label>
              <select required name="applyLevel" className={inputCls}>
                {Object.entries(APPLY_LEVEL_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>From Date *</label>
              <input required name="fromDate" type="date" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>To Date *</label>
              <input required name="toDate" type="date" className={inputCls} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input name="isForMember" type="checkbox" className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500" />
                <span className="text-sm font-medium dark:text-gray-300">Members Only</span>
              </label>
            </div>
            <div>
              <label className={labelCls}>Apply From Time (hour 0–23)</label>
              <input name="applyFromTime" type="number" min={0} max={23} className={inputCls} placeholder="e.g. 8" />
            </div>
            <div>
              <label className={labelCls}>Apply To Time (hour 0–23)</label>
              <input name="applyToTime" type="number" min={0} max={23} className={inputCls} placeholder="e.g. 22" />
            </div>
          </div>
        </div>

        {/* ── Section: Promotion Details / Rules ── */}
        <div className="p-6 bg-white rounded-xl shadow dark:bg-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Detail Rules</h2>
            <button
              type="button"
              onClick={addDetail}
              className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors"
            >
              + Add Rule
            </button>
          </div>

          {details.map((detail, idx) => (
            <div key={idx} className="border dark:border-gray-700 rounded-lg p-4 mb-4 relative">
              {details.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDetail(idx)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-bold"
                >
                  ✕ Remove
                </button>
              )}
              <p className="text-xs text-gray-400 mb-3">Rule #{idx + 1}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Detail Code</label>
                  <input
                    className={inputCls}
                    value={detail.promotionDetailCode || ''}
                    onChange={(e) => updateDetail(idx, 'promotionDetailCode', e.target.value)}
                    placeholder="e.g. RULE01"
                  />
                </div>
                <div>
                  <label className={labelCls}>Min Order Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className={inputCls}
                    value={detail.minOrderAmount ?? ''}
                    onChange={(e) => updateDetail(idx, 'minOrderAmount', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Max Order Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className={inputCls}
                    value={detail.maxOrderAmount ?? ''}
                    onChange={(e) => updateDetail(idx, 'maxOrderAmount', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Discount Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={inputCls}
                    value={detail.discountRate ?? ''}
                    onChange={(e) => updateDetail(idx, 'discountRate', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 10"
                  />
                </div>
                <div>
                  <label className={labelCls}>Discount Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className={inputCls}
                    value={detail.discountAmount ?? ''}
                    onChange={(e) => updateDetail(idx, 'discountAmount', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 50000"
                  />
                </div>
                <div>
                  <label className={labelCls}>Buy Product Code</label>
                  <input
                    className={inputCls}
                    value={detail.buyProductCode || ''}
                    onChange={(e) => updateDetail(idx, 'buyProductCode', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Min Buy Qty</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={detail.minBuyQuantity ?? ''}
                    onChange={(e) => updateDetail(idx, 'minBuyQuantity', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Gift Product Code</label>
                  <input
                    className={inputCls}
                    value={detail.giftProductCode || ''}
                    onChange={(e) => updateDetail(idx, 'giftProductCode', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Gift Qty</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={detail.giftQuantity ?? ''}
                    onChange={(e) => updateDetail(idx, 'giftQuantity', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Section: Store Assignment ── */}
        <div className="p-6 bg-white rounded-xl shadow dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Assign to Stores</h2>
          {stores.length === 0 ? (
            <p className="text-sm text-gray-400">No stores available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {stores.map((store: any) => {
                const storeId = store.id || store.storeId;
                const isChecked = selectedStoreIds.includes(storeId);
                return (
                  <label
                    key={storeId}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleStore(storeId)}
                      className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium dark:text-gray-200">{store.name || store.storeName}</span>
                  </label>
                );
              })}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {selectedStoreIds.length} store(s) selected
          </p>
        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create Promotion'}
          </button>
        </div>
      </form>
    </div>
  );
}
