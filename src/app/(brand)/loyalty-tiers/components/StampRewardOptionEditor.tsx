'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  getEffectiveStampProgram,
  getSharedStampReward,
  updateSharedStampReward,
  type SharedStampReward,
} from '@/services/stampPrograms';
import type { LoyaltyProductOption } from '@/services/loyaltyProductContracts';
import { BrandProductPicker } from './BrandProductPicker';

type Props = {
  products: LoyaltyProductOption[];
  productItems: LoyaltyProductOption[];
  loadingProducts: boolean;
};

type Draft = {
  rewardType: 3 | 4;
  productId: number | null;
  productItemId: number | null;
  quantity: string;
};

const inputClass = 'mt-2 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white';
const emptyDraft: Draft = { rewardType: 3, productId: null, productItemId: null, quantity: '1' };

export function StampRewardOptionEditor({ products, productItems, loadingProducts }: Props) {
  const [programId, setProgramId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const programResponse = await getEffectiveStampProgram();
        if (programResponse?.status === 404) return;
        if (programResponse?.status !== 200 || !programResponse.data?.id)
          throw new Error(programResponse?.message || 'Không thể xác định chương trình tích tem đang áp dụng.');
        const nextProgramId = Number(programResponse.data.id);
        setProgramId(nextProgramId);
        const rewardResponse = await getSharedStampReward(nextProgramId);
        if (rewardResponse?.status === 404) return;
        if (rewardResponse?.status !== 200)
          throw new Error(rewardResponse?.message || 'Không thể tải quà đổi tem.');
        const reward = rewardResponse.data as SharedStampReward;
        setDraft({
          rewardType: reward.rewardType === 4 ? 4 : 3,
          productId: reward.productId ?? null,
          productItemId: reward.productItemId ?? null,
          quantity: String(reward.quantity || 1),
        });
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : 'Không thể tải cấu hình đổi tem.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!programId) return;
    const quantity = Number(draft.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) return setError('Số lượng quà phải là số nguyên lớn hơn 0.');
    if (draft.rewardType === 3 && !draft.productId) return setError('Hãy chọn một sản phẩm menu.');
    if (draft.rewardType === 4 && !draft.productItemId) return setError('Hãy chọn một quà vật lý.');

    setSaving(true);
    setError('');
    try {
      const response = await updateSharedStampReward(programId, {
        rewardType: draft.rewardType,
        productId: draft.rewardType === 3 ? draft.productId : null,
        productItemId: draft.rewardType === 4 ? draft.productItemId : null,
        quantity,
      });
      if (response?.status !== 200) throw new Error(response?.message || 'Không thể lưu quà đổi tem.');
      toast.success('Đã lưu quà đổi tem dùng chung.');
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu quà đổi tem.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quà đổi bằng tem</h2>
      {loading ? (
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      ) : !programId ? (
        <div className="mt-4 rounded-lg border border-gray-200 p-4 text-theme-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
          Chưa có chương trình tích tem đang áp dụng.{' '}
          <Link href="/stamp-programs" className="font-medium text-brand-500 hover:text-brand-600">Quản lý chương trình tích tem</Link>
        </div>
      ) : (
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Loại quà</label>
              <select value={draft.rewardType} onChange={(event) => setDraft({ ...draft, rewardType: Number(event.target.value) as 3 | 4, productId: null, productItemId: null })} className={inputClass}>
                <option value="3">Sản phẩm menu</option>
                <option value="4">Quà vật lý</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <BrandProductPicker
                label={draft.rewardType === 4 ? 'Quà vật lý' : 'Sản phẩm menu'}
                value={draft.rewardType === 4 ? draft.productItemId : draft.productId}
                options={draft.rewardType === 4 ? productItems : products}
                onChange={(value) => setDraft(draft.rewardType === 4 ? { ...draft, productItemId: value, productId: null } : { ...draft, productId: value, productItemId: null })}
                disabled={loadingProducts}
                emptyLabel="Chọn quà"
              />
            </div>
            <div>
              <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Số lượng</label>
              <input type="number" min="1" step="1" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: event.target.value })} className={inputClass} required />
            </div>
          </div>
          <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-brand-500 px-5 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Lưu quà đổi tem'}
          </button>
          {error && <p role="alert" className="text-theme-sm text-error-600 dark:text-error-400">{error}</p>}
        </form>
      )}
      {!programId && error && <p role="alert" className="mt-3 text-theme-sm text-error-600 dark:text-error-400">{error}</p>}
    </section>
  );
}
