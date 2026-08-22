'use client';

import React, { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { upsertLoyaltyRewardPolicy, type LoyaltyRewardPolicy } from '@/services/loyaltyRewards';
import {
  buildRewardPolicyPayload,
  createEmptyRewardRule,
  defaultRewardPolicyValidityDays,
  type RewardPolicyForm,
  type RewardRuleForm,
} from '@/services/loyaltyRewardContracts';
import type { LoyaltyProductOption } from '@/services/loyaltyProductContracts';
import type { BrandLoyaltyTier } from '@/services/loyaltyTiers';
import { RewardRuleEditor } from './RewardRuleEditor';
import {
  DollarLineIcon,
  BoxCubeIcon,
  ShootingStarIcon,
  PlusIcon,
  CheckCircleIcon,
} from '@/icons';

type RewardPolicyEditorProps = {
  tier: BrandLoyaltyTier;
  policies: LoyaltyRewardPolicy[];
  products: LoyaltyProductOption[];
  loadingProducts: boolean;
  onSaved: () => Promise<void>;
};

const inputClass =
  'mt-1.5 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500';

const labelClass = 'text-theme-sm font-medium text-gray-700 dark:text-gray-300';

const formatVnd = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}₫`;

const triggerTabs = [
  {
    value: 1 as const,
    label: 'Voucher hàng tháng',
    subtitle: 'Tự động phát vào ví đầu mỗi tháng',
    icon: DollarLineIcon,
  },
  {
    value: 2 as const,
    label: 'Ưu đãi sinh nhật',
    subtitle: 'Phát vào tháng sinh nhật khách hàng',
    icon: BoxCubeIcon,
  },
  {
    value: 3 as const,
    label: 'Quà thăng hạng',
    subtitle: 'Phát ngay khi khách đạt hạng này',
    icon: ShootingStarIcon,
  },
];

const percentageFromBasisPoints = (value: number | null) =>
  value === null ? '' : String(value / 100);

const toForm = (
  tier: BrandLoyaltyTier,
  policy?: LoyaltyRewardPolicy,
  fallbackTrigger: 1 | 2 | 3 = 1,
): RewardPolicyForm => ({
  id: policy?.id,
  tierId: tier.id,
  policyCode:
    policy?.policyCode ??
    `${tier.tierName.toUpperCase()}-${
      fallbackTrigger === 1
        ? 'MONTHLY'
        : fallbackTrigger === 2
        ? 'BIRTHDAY'
        : 'UPGRADE'
    }`,
  trigger: policy?.trigger ?? fallbackTrigger,
  rewardType: (policy?.rewardType ?? 1) as RewardPolicyForm['rewardType'],
  monthlyCount: String(policy?.monthlyCount ?? tier.monthlyVoucherCount),
  validityDays: String(
    policy?.validityDays ?? defaultRewardPolicyValidityDays(fallbackTrigger),
  ),
  minOrderAmount: String(policy?.minOrderAmount ?? 0),
  active: policy?.active ?? true,
  rules: policy?.rules.length
    ? policy.rules.map((rule, index) => ({
        displayOrder: index,
        rewardType: rule.rewardType as RewardRuleForm['rewardType'],
        productId: rule.productId,
        productItemId: rule.productItemId,
        percentage: percentageFromBasisPoints(rule.percentageBasisPoints),
        amount: rule.amount === null ? '' : String(rule.amount),
        quantity: rule.quantity === null ? '' : String(rule.quantity),
        minOrderAmount:
          rule.minOrderAmount === null ? '' : String(rule.minOrderAmount),
        valueMode:
          rule.percentageBasisPoints !== null ? 'percentage' : 'amount',
        assetType: rule.productItemId ? 'physical' : 'product',
      }))
    : [createEmptyRewardRule(0)],
});

export function RewardPolicyEditor({
  tier,
  policies,
  products,
  loadingProducts,
  onSaved,
}: RewardPolicyEditorProps) {
  const [trigger, setTrigger] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<RewardPolicyForm>(() =>
    toForm(tier, policies.find((policy) => policy.trigger === 1)),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const policyByTrigger = useMemo(
    () => new Map(policies.map((policy) => [policy.trigger, policy])),
    [policies],
  );

  const switchTrigger = (nextTrigger: 1 | 2 | 3) => {
    setTrigger(nextTrigger);
    setForm(toForm(tier, policyByTrigger.get(nextTrigger), nextTrigger));
    setError('');
  };

  const updateForm = (patch: Partial<RewardPolicyForm>) =>
    setForm((current) => ({ ...current, ...patch }));

  const updateRule = (index: number, rule: RewardRuleForm) => {
    updateForm({
      rules: form.rules.map((current, currentIndex) =>
        currentIndex === index ? { ...rule, displayOrder: index } : current,
      ),
    });
  };

  const addRule = () =>
    updateForm({
      rules: [...form.rules, createEmptyRewardRule(form.rules.length)],
    });

  const removeRule = (index: number) => {
    const rules = form.rules
      .filter((_, currentIndex) => currentIndex !== index)
      .map((rule, currentIndex) => ({ ...rule, displayOrder: currentIndex }));
    updateForm({ rules: rules.length ? rules : [createEmptyRewardRule(0)] });
  };

  const validate = () => {
    if (!form.policyCode.trim()) return 'Mã chính sách là bắt buộc.';
    if (
      Number(form.monthlyCount) < 0 ||
      !Number.isInteger(Number(form.monthlyCount))
    )
      return 'Số voucher tháng phải là số nguyên không âm.';
    if (
      Number(form.validityDays) < 0 ||
      !Number.isInteger(Number(form.validityDays))
    )
      return 'Số ngày hết hạn phải là số nguyên không âm.';
    if (Number(form.minOrderAmount) < 0) return 'Đơn tối thiểu không thể âm.';
    for (const rule of form.rules) {
      if (
        rule.rewardType === 1 ||
        (rule.rewardType === 3 && rule.valueMode !== 'amount')
      ) {
        if (
          rule.percentage === '' ||
          Number(rule.percentage) < 0 ||
          Number(rule.percentage) > 100
        )
          return 'Phần trăm phải nằm trong khoảng 0–100.';
      }
      if (
        rule.rewardType === 2 ||
        (rule.rewardType === 3 && rule.valueMode === 'amount')
      ) {
        if (rule.amount === '' || Number(rule.amount) < 0)
          return 'Số tiền giảm phải là số không âm.';
      }
      if ((rule.rewardType === 3 || rule.rewardType === 4) && !rule.productId)
        return 'Mỗi quy tắc sản phẩm cần chọn sản phẩm thuộc thương hiệu.';
      if (
        rule.rewardType === 4 &&
        (!rule.quantity ||
          Number(rule.quantity) <= 0 ||
          !Number.isInteger(Number(rule.quantity)))
      )
        return 'Số lượng quà phải là số nguyên lớn hơn 0.';
      if (rule.minOrderAmount !== '' && Number(rule.minOrderAmount) < 0)
        return 'Đơn tối thiểu của quy tắc không thể âm.';
    }
    return '';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await upsertLoyaltyRewardPolicy(
        buildRewardPolicyPayload({ ...form, trigger }),
      );
      if (response.status !== 200 && response.status !== 201)
        throw new Error(response.message || 'Không thể lưu chính sách.');
      const currentTab = triggerTabs.find((t) => t.value === trigger)?.label || 'quyền lợi';
      toast.success(`Đã lưu ${currentTab.toLowerCase()} cho hạng ${tier.tierName}.`);
      await onSaved();
    } catch (saveError: unknown) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'Không thể lưu chính sách.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // Compute live preview reward title
  const primaryRule = form.rules[0];
  const primaryProduct = primaryRule?.productId
    ? products.find((p) => p.id === primaryRule.productId)
    : null;

  const rewardSummaryText = useMemo(() => {
    if (!primaryRule) return 'Chưa có ưu đãi';
    if (primaryRule.rewardType === 1) {
      return primaryRule.percentage
        ? `Giảm ${primaryRule.percentage}% toàn bill`
        : 'Giảm theo phần trăm';
    }
    if (primaryRule.rewardType === 2) {
      return primaryRule.amount
        ? `Giảm ${formatVnd(Number(primaryRule.amount))}`
        : 'Giảm số tiền';
    }
    if (primaryRule.rewardType === 3) {
      const val =
        primaryRule.valueMode === 'amount'
          ? formatVnd(Number(primaryRule.amount) || 0)
          : `${primaryRule.percentage || 0}%`;
      return `Giảm ${val} cho ${primaryProduct?.name || 'món chọn'}`;
    }
    if (primaryRule.rewardType === 4) {
      return `Tặng ${primaryRule.quantity || 1} ${
        primaryProduct?.name || 'món miễn phí'
      }`;
    }
    return 'Ưu đãi thành viên';
  }, [primaryRule, primaryProduct]);

  return (
    <article className="rounded-xl border border-gray-200 bg-white shadow-theme-xs transition dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      {/* 1. TOP TRIGGER SELECTOR BAR */}
      <div className="border-b border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-theme-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block">
              Hạng {tier.tierName}
            </span>
            <h3 className="text-theme-lg font-bold text-gray-900 dark:text-white">
              Cấu hình Quyền lợi &amp; Voucher phát tự động
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {triggerTabs.map((tab) => {
              const isSelected = trigger === tab.value;
              const Icon = tab.icon;
              const configured = policyByTrigger.has(tab.value);
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => switchTrigger(tab.value)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-theme-xs font-bold transition active:scale-95 ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-theme-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {configured && (
                    <span
                      className={`size-2 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN LAYOUT: FORM & LIVE VOUCHER PREVIEW */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: CONFIGURATION INPUTS & RULES (7 COLS) */}
          <div className="lg:col-span-8 space-y-6">
            {/* GENERAL POLICY SETTINGS */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 dark:border-gray-800 dark:bg-gray-800/30 space-y-4">
              <span className="text-theme-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                1. Thiết lập cơ bản cho voucher
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Mã chính sách (Policy Code) *</label>
                  <input
                    value={form.policyCode}
                    onChange={(event) =>
                      updateForm({ policyCode: event.target.value })
                    }
                    className={inputClass}
                    maxLength={100}
                    placeholder="VD: GOLD-MONTHLY"
                    required
                  />
                  <span className="mt-1 block text-theme-xs text-gray-400">
                    Mã định danh nội bộ
                  </span>
                </div>

                <div>
                  <label className={labelClass}>Hạn sử dụng voucher (ngày)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.validityDays}
                    onChange={(event) =>
                      updateForm({ validityDays: event.target.value })
                    }
                    className={inputClass}
                    placeholder="0 = Đến hết tháng"
                  />
                  <span className="mt-1 block text-theme-xs text-gray-400">
                    {Number(form.validityDays) === 0
                      ? 'Hết hạn vào ngày cuối cùng của tháng'
                      : `Có hiệu lực ${form.validityDays} ngày từ lúc phát`}
                  </span>
                </div>

                {trigger === 1 && (
                  <div>
                    <label className={labelClass}>Số lượng voucher phát / tháng *</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.monthlyCount}
                      onChange={(event) =>
                        updateForm({ monthlyCount: event.target.value })
                      }
                      className={inputClass}
                      required
                    />
                    <span className="mt-1 block text-theme-xs text-gray-400">
                      Tự động phát vào ngày 01 hàng tháng
                    </span>
                  </div>
                )}

                <div>
                  <label className={labelClass}>Đơn hàng tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.minOrderAmount}
                    onChange={(event) =>
                      updateForm({ minOrderAmount: event.target.value })
                    }
                    className={inputClass}
                    placeholder="Ví dụ: 50000"
                  />
                  <span className="mt-1 block text-theme-xs font-semibold text-brand-600 dark:text-brand-400">
                    Áp dụng từ: {formatVnd(Number(form.minOrderAmount) || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* RULES SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-theme-sm font-bold text-gray-900 dark:text-white">
                    2. Quy tắc giảm giá / Quà tặng chi tiết
                  </h4>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Chọn hình thức ưu đãi khách hàng sẽ nhận được khi áp dụng voucher này.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRule}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-theme-xs font-bold text-brand-600 hover:bg-brand-100 transition dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
                >
                  <PlusIcon className="w-4 h-4 shrink-0" />
                  <span>Thêm quy tắc</span>
                </button>
              </div>

              {form.rules.map((rule, index) => (
                <RewardRuleEditor
                  key={`${trigger}-${index}`}
                  rule={rule}
                  products={products}
                  loadingProducts={loadingProducts}
                  onChange={(next) => updateRule(index, next)}
                  onRemove={() => removeRule(index)}
                  canRemove={form.rules.length > 1}
                />
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE VOUCHER APP SIMULATION PREVIEW (4 COLS) */}
          <div className="lg:col-span-4 sticky top-6 space-y-4">
            <span className="text-theme-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
              Mô phỏng voucher trên App Khách Hàng
            </span>

            {/* TICKET / VOUCHER MOCKUP */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-700 dark:bg-gray-800 space-y-4 relative overflow-hidden">
              {/* Top Accent Pill */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-theme-xs font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" />
                  Hạng {tier.tierName}
                </span>

                <span className="text-theme-xs font-bold text-gray-400 uppercase">
                  {trigger === 1
                    ? 'Voucher Tháng'
                    : trigger === 2
                    ? 'Sinh Nhật'
                    : 'Thăng Hạng'}
                </span>
              </div>

              {/* Reward Headline */}
              <div className="border-t border-b border-dashed border-gray-200 dark:border-gray-700 py-4 my-2">
                <span className="text-theme-xs text-gray-500 dark:text-gray-400 block">
                  Quyền lợi nhận được:
                </span>
                <div className="mt-1 text-theme-xl font-extrabold text-brand-600 dark:text-brand-400 tracking-tight leading-tight">
                  {rewardSummaryText}
                </div>
                {form.rules.length > 1 && (
                  <span className="mt-1 text-theme-xs text-emerald-600 dark:text-emerald-400 block font-medium">
                    + {form.rules.length - 1} quy tắc ưu đãi kết hợp
                  </span>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="space-y-2 text-theme-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Đơn tối thiểu:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {Number(form.minOrderAmount) > 0
                      ? formatVnd(Number(form.minOrderAmount))
                      : 'Không yêu cầu'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Hạn sử dụng:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {Number(form.validityDays) === 0
                      ? 'Hết tháng'
                      : `${form.validityDays} ngày từ lúc nhận`}
                  </span>
                </div>
                {trigger === 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Số lượng phát:</span>
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      {form.monthlyCount} voucher / tháng
                    </span>
                  </div>
                )}
              </div>

              {/* Code Barcode Footer */}
              <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                <span className="text-theme-xs font-mono font-bold tracking-widest text-gray-800 dark:text-gray-200 block">
                  {form.policyCode || 'VOUCHER-CODE'}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Dùng được tại POS quầy &amp; Mobile App
                </span>
              </div>
            </div>

            {/* HELPER TEXT */}
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              Khách hàng khi đạt hạng {tier.tierName} sẽ tự động nhận được
              voucher có giao diện và điều kiện như trên vào Ví Voucher.
            </p>
          </div>
        </div>

        {/* 3. FOOTER ACTIONS */}
        <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.active}
              onClick={() => updateForm({ active: !form.active })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                form.active ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  form.active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-theme-sm font-semibold text-gray-800 dark:text-gray-200">
              {form.active ? 'Đang kích hoạt chính sách ưu đãi này' : 'Tạm ẩn chính sách ưu đãi này'}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-8 py-3 text-theme-sm font-bold text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
          >
            {saving && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
            )}
            {saving ? 'Đang lưu chính sách...' : 'Lưu chính sách ưu đãi'}
          </button>
        </div>

        {error && (
          <p
            className="mt-4 rounded-lg border border-error-200 bg-error-50 px-3.5 py-3 text-theme-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </form>
    </article>
  );
}
