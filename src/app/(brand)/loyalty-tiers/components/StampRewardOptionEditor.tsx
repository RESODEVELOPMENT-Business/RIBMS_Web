'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  createStampProgram,
  getStampPrograms,
  updateStampProgram,
  type StampProgram,
  type StampRewardOption,
} from '@/services/stampPrograms';
import type { LoyaltyProductOption } from '@/services/loyaltyProductContracts';
import type { BrandLoyaltyTier } from '@/services/loyaltyTiers';
import { BrandProductPicker } from './BrandProductPicker';

type StampRewardOptionEditorProps = {
  brandId: number;
  tiers: BrandLoyaltyTier[];
  products: LoyaltyProductOption[];
  productItems: LoyaltyProductOption[];
  loadingProducts: boolean;
};

type StampRewardDraft = {
  stampRequired: string;
  rewardType: 3 | 4;
  brandLoyaltyTierId: number | null;
  productId: number | null;
  productItemId: number | null;
  quantity: string;
  active: boolean;
  sortOrder: string;
};

const inputClass =
  'mt-2 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-theme-xs transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500';
const selectClass = `${inputClass} appearance-none`;

const emptyOption = (sortOrder: number): StampRewardDraft => ({
  stampRequired: '1',
  rewardType: 3,
  brandLoyaltyTierId: null,
  productId: null,
  productItemId: null,
  quantity: '1',
  active: true,
  sortOrder: String(sortOrder),
});

const toDraft = (option: StampRewardOption, index: number): StampRewardDraft => ({
  stampRequired: String(option.stampRequired),
  rewardType: option.rewardType === 4 || option.rewardType === 'PhysicalGift' ? 4 : 3,
  brandLoyaltyTierId: option.brandLoyaltyTierId ?? null,
  productId: option.productId ?? null,
  productItemId: option.productItemId ?? null,
  quantity: String(option.quantity ?? 1),
  active: option.active ?? true,
  sortOrder: String(option.sortOrder ?? index),
});

const unwrapPrograms = (response: unknown): StampProgram[] => {
  if (!response || typeof response !== 'object') return [];
  const data = (response as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data as StampProgram[];
};

export function StampRewardOptionEditor({
  brandId,
  tiers,
  products,
  productItems,
  loadingProducts,
}: StampRewardOptionEditorProps) {
  const [programs, setPrograms] = useState<StampProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState('Đổi quà bằng tem');
  const [options, setOptions] = useState<StampRewardDraft[]>([emptyOption(0)]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const productNames = useMemo(() => new Map(products.map((product) => [product.id, product.name])), [products]);
  const productItemNames = useMemo(() => new Map(productItems.map((item) => [item.id, item.name])), [productItems]);

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const response = await getStampPrograms(1, 100, true);
      const nextPrograms = unwrapPrograms(response);
      setPrograms(nextPrograms);
      if (nextPrograms.length > 0 && selectedProgramId === null) {
        const first = nextPrograms[0];
        setSelectedProgramId(first.id);
        setDisplayName(first.displayName);
        setOptions(first.rewardTiers.length ? first.rewardTiers.map(toDraft) : [emptyOption(0)]);
      }
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải cấu hình đổi tem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPrograms();
    // Load once when the authenticated Brand is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  const selectProgram = (programId: number | null) => {
    setSelectedProgramId(programId);
    const program = programs.find((item) => item.id === programId);
    setDisplayName(program?.displayName ?? 'Đổi quà bằng tem');
    setOptions(program?.rewardTiers.length ? program.rewardTiers.map(toDraft) : [emptyOption(0)]);
    setError('');
  };

  const updateOption = (index: number, patch: Partial<StampRewardDraft>) => {
    setOptions((current) => current.map((option, optionIndex) => optionIndex === index ? { ...option, ...patch } : option));
  };

  const validate = () => {
    if (!displayName.trim()) return 'Tên chương trình đổi tem là bắt buộc.';
    if (!options.length) return 'Cần ít nhất một mốc đổi quà.';
    for (const option of options) {
      if (!Number.isInteger(Number(option.stampRequired)) || Number(option.stampRequired) <= 0) return 'Mốc tem phải là số nguyên lớn hơn 0.';
      if (!Number.isInteger(Number(option.quantity)) || Number(option.quantity) <= 0) return 'Số lượng quà phải là số nguyên lớn hơn 0.';
      if (option.rewardType === 3 && !option.productId) return 'Mỗi quà menu phải chọn một sản phẩm thuộc thương hiệu.';
      if (option.rewardType === 4 && !option.productItemId) return 'Mỗi quà vật lý phải chọn một ProductItem thuộc thương hiệu.';
    }
    return '';
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    const rewardTiers = options.map((option, index) => ({
      stampRequired: Number(option.stampRequired),
      rewardType: option.rewardType,
      rewardValue: option.rewardType === 3 ? String(option.productId) : String(option.productItemId),
      rewardDescription: option.rewardType === 3
        ? productNames.get(option.productId ?? 0) ?? 'Quà sản phẩm'
        : productItemNames.get(option.productItemId ?? 0) ?? 'Quà vật lý',
      brandLoyaltyTierId: option.brandLoyaltyTierId,
      productId: option.rewardType === 3 ? option.productId : null,
      productItemId: option.rewardType === 4 ? option.productItemId : null,
      quantity: Number(option.quantity),
      active: option.active,
      sortOrder: Number(option.sortOrder) || index,
    }));

    try {
      const response = selectedProgramId
        ? await updateStampProgram(selectedProgramId, { displayName: displayName.trim(), rewardTiers })
        : await createStampProgram({
            brandId,
            displayName: displayName.trim(),
            description: 'Cấu hình đổi quà bằng tem cho thành viên.',
            conditionLogic: 'AND',
            storeIds: [],
            conditions: [],
            rewardTiers,
          });
      if (response?.status !== 200 && response?.status !== 201) throw new Error(response?.message || 'Không thể lưu cấu hình đổi tem.');
      toast.success('Đã lưu cấu hình đổi quà bằng tem.');
      await loadPrograms();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu cấu hình đổi tem.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-theme-xs font-semibold text-brand-500 dark:text-brand-400">STAMP REWARDS</p>
          <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">Quà đổi bằng tem</h2>
          <p className="mt-1 max-w-2xl text-theme-sm text-gray-500 dark:text-gray-400">Chọn sản phẩm menu hoặc ProductItem làm quà vật lý. Nếu gắn với hạng, ngưỡng tem của hạng sẽ là mốc hiệu lực.</p>
        </div>
        <div className="w-full lg:max-w-xs">
          <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Chương trình</label>
          <select value={selectedProgramId ?? ''} onChange={(event) => selectProgram(event.target.value ? Number(event.target.value) : null)} className={selectClass} disabled={loading}>
            <option value="">Tạo chương trình mới</option>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.displayName}</option>)}
          </select>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-5 space-y-5">
        <div className="max-w-xl">
          <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Tên chương trình *</label>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={inputClass} required />
        </div>

        <div className="space-y-4">
          {options.map((option, index) => {
            const selectedTier = tiers.find((tier) => tier.id === option.brandLoyaltyTierId);
            return (
              <div key={index} className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-theme-sm font-semibold text-gray-900 dark:text-white">Mốc quà #{index + 1}</p>
                    <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{selectedTier ? `Áp dụng cho ${selectedTier.tierName}` : 'Áp dụng chung cho các hạng'}</p>
                  </div>
                  {options.length > 1 && <button type="button" onClick={() => setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="min-h-10 rounded-lg px-3 text-theme-sm font-medium text-error-500 hover:bg-error-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-500/40">Xóa mốc</button>}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Tem cần đổi *</label>
                    <input type="number" min="1" step="1" value={option.stampRequired} onChange={(event) => updateOption(index, { stampRequired: event.target.value })} className={inputClass} required />
                  </div>
                  <div>
                    <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Loại quà</label>
                    <select value={option.rewardType} onChange={(event) => updateOption(index, { rewardType: Number(event.target.value) as 3 | 4, productId: null, productItemId: null })} className={selectClass}>
                      <option value="3">Sản phẩm menu</option>
                      <option value="4">Quà vật lý</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Hạng áp dụng</label>
                    <select value={option.brandLoyaltyTierId ?? ''} onChange={(event) => updateOption(index, { brandLoyaltyTierId: event.target.value ? Number(event.target.value) : null })} className={selectClass}>
                      <option value="">Tất cả hạng</option>
                      {tiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.tierName} — ngưỡng {tier.stampThreshold} tem</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Số lượng *</label>
                    <input type="number" min="1" step="1" value={option.quantity} onChange={(event) => updateOption(index, { quantity: event.target.value })} className={inputClass} required />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <BrandProductPicker
                      label={option.rewardType === 4 ? 'ProductItem quà vật lý *' : 'Sản phẩm menu *'}
                      value={option.rewardType === 4 ? option.productItemId : option.productId}
                      options={option.rewardType === 4 ? productItems : products}
                      onChange={(value) => updateOption(index, option.rewardType === 4 ? { productItemId: value, productId: null } : { productId: value, productItemId: null })}
                      disabled={loadingProducts}
                      emptyLabel={loadingProducts ? 'Đang tải danh sách...' : 'Chọn quà'}
                    />
                  </div>
                  <div>
                    <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Thứ tự</label>
                    <input type="number" min="0" step="1" value={option.sortOrder} onChange={(event) => updateOption(index, { sortOrder: event.target.value })} className={inputClass} />
                  </div>
                </div>
                <label className="mt-4 flex min-h-11 items-center gap-3 text-theme-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={option.active} onChange={(event) => updateOption(index, { active: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/30" />
                  Kích hoạt mốc quà
                </label>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <button type="button" onClick={() => setOptions((current) => [...current, emptyOption(current.length)])} className="min-h-11 rounded-lg border border-brand-200 px-4 text-theme-sm font-medium text-brand-500 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:border-brand-500/30 dark:hover:bg-brand-500/10">Thêm mốc đổi quà</button>
          <button type="submit" disabled={saving || loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-theme-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60">
            {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
            {saving ? 'Đang lưu...' : 'Lưu quà đổi tem'}
          </button>
        </div>
        {error && <p className="rounded-lg border border-error-200 bg-error-50 px-3.5 py-3 text-theme-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400" role="alert">{error}</p>}
      </form>
    </section>
  );
}
