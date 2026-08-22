'use client';

import React from 'react';
import { BrandProductPicker } from './BrandProductPicker';
import type { LoyaltyProductOption } from '@/services/loyaltyProductContracts';
import type { RewardRuleForm, RewardType } from '@/services/loyaltyRewardContracts';
import {
  DollarLineIcon,
  BoxCubeIcon,
  ShootingStarIcon,
  TrashBinIcon,
  CheckCircleIcon,
} from '@/icons';

type RewardRuleEditorProps = {
  rule: RewardRuleForm;
  products: LoyaltyProductOption[];
  loadingProducts: boolean;
  onChange: (next: RewardRuleForm) => void;
  onRemove: () => void;
  canRemove: boolean;
};

const inputClass =
  'mt-1.5 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-theme-sm text-gray-900 shadow-theme-xs transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500';

const labelClass = 'text-theme-sm font-medium text-gray-700 dark:text-gray-300';

const formatVnd = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}₫`;

const rewardTypeOptions: Array<{
  value: RewardType;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 1,
    title: 'Giảm theo phần trăm',
    desc: 'Giảm % trên tổng giá trị đơn hàng',
    icon: DollarLineIcon,
  },
  {
    value: 2,
    title: 'Giảm số tiền',
    desc: 'Trừ trực tiếp số tiền cố định trên bill',
    icon: DollarLineIcon,
  },
  {
    value: 3,
    title: 'Giảm trên sản phẩm',
    desc: 'Giảm giá theo % hoặc tiền cho món cụ thể',
    icon: BoxCubeIcon,
  },
  {
    value: 4,
    title: 'Tặng sản phẩm / quà',
    desc: 'Tặng món đồ uống hoặc quà tặng miễn phí',
    icon: ShootingStarIcon,
  },
];

export function RewardRuleEditor({
  rule,
  products,
  loadingProducts,
  onChange,
  onRemove,
  canRemove,
}: RewardRuleEditorProps) {
  const update = (patch: Partial<RewardRuleForm>) => onChange({ ...rule, ...patch });
  const usesPercentage =
    rule.rewardType === 1 || (rule.rewardType === 3 && rule.valueMode !== 'amount');
  const usesAmount =
    rule.rewardType === 2 || (rule.rewardType === 3 && rule.valueMode === 'amount');
  const usesAsset = rule.rewardType === 3 || rule.rewardType === 4;
  const usesQuantity = rule.rewardType === 4;

  const handleRewardTypeChange = (rewardType: RewardType) => {
    const next: Partial<RewardRuleForm> = {
      rewardType,
      productId: null,
      productItemId: null,
      percentage: '',
      amount: '',
      quantity: rewardType === 4 ? '1' : '',
      valueMode: rewardType === 3 ? 'percentage' : undefined,
      assetType: undefined,
    };
    update(next);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-5 shadow-theme-xs transition dark:border-gray-800 dark:bg-gray-800/40 space-y-4">
      {/* RULE HEADER */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-200 dark:border-gray-700/60 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
              {rule.displayOrder + 1}
            </span>
            <p className="text-theme-sm font-bold text-gray-900 dark:text-white">
              Quy tắc giảm giá #{rule.displayOrder + 1}
            </p>
          </div>
          <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
            Hệ thống sẽ áp dụng theo thứ tự ưu tiên từ trên xuống.
          </p>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-theme-xs font-medium text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition"
          >
            <TrashBinIcon className="size-4" />
            <span>Xóa quy tắc</span>
          </button>
        )}
      </div>

      {/* 1. VISUAL CHOICE CARDS FOR REWARD TYPE */}
      <div>
        <label className={`${labelClass} block mb-2`}>
          Chọn hình thức ưu đãi *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {rewardTypeOptions.map((opt) => {
            const isSelected = rule.rewardType === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleRewardTypeChange(opt.value)}
                className={`relative flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 text-brand-900 shadow-theme-xs ring-2 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-950/40 dark:text-brand-200'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  {isSelected && (
                    <CheckCircleIcon className="size-4 text-brand-500 dark:text-brand-400" />
                  )}
                </div>

                <span className="mt-2.5 font-bold text-theme-sm block">
                  {opt.title}
                </span>
                <span className="mt-0.5 text-theme-xs opacity-75 line-clamp-2">
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. REWARD VALUES & CONFIGURATION */}
      <div className="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* VALUE MODE TOGGLE (WHEN REWARD TYPE IS ON SPECIFIC PRODUCT) */}
        {rule.rewardType === 3 && (
          <div className="md:col-span-2">
            <label className={labelClass}>Hình thức giảm giá trên món *</label>
            <div className="mt-2 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/80">
              <button
                type="button"
                onClick={() =>
                  update({
                    valueMode: 'percentage',
                    percentage: '',
                    amount: '',
                  })
                }
                className={`rounded-md px-3.5 py-1.5 text-theme-xs font-semibold transition ${
                  (rule.valueMode ?? 'percentage') === 'percentage'
                    ? 'bg-brand-500 text-white shadow-theme-xs'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Giảm theo phần trăm (%)
              </button>
              <button
                type="button"
                onClick={() =>
                  update({
                    valueMode: 'amount',
                    percentage: '',
                    amount: '',
                  })
                }
                className={`rounded-md px-3.5 py-1.5 text-theme-xs font-semibold transition ${
                  rule.valueMode === 'amount'
                    ? 'bg-brand-500 text-white shadow-theme-xs'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Giảm theo số tiền (VNĐ)
              </button>
            </div>
          </div>
        )}

        {/* PRODUCT PICKER */}
        {usesAsset && (
          <div className="md:col-span-2">
            <BrandProductPicker
              label={
                rule.rewardType === 4
                  ? 'Chọn sản phẩm / đồ uống tặng *'
                  : 'Chọn sản phẩm áp dụng giảm giá *'
              }
              value={rule.productId as number | null}
              options={products}
              onChange={(value) =>
                update({ productId: value, productItemId: null })
              }
              disabled={loadingProducts}
              emptyLabel={
                loadingProducts
                  ? 'Đang tải danh sách món...'
                  : 'Chọn sản phẩm từ danh mục thương hiệu'
              }
            />
          </div>
        )}

        {/* PERCENTAGE VALUE INPUT */}
        {usesPercentage && (
          <div>
            <label className={labelClass}>Mức giảm (%) *</label>
            <div className="relative mt-1.5">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={rule.percentage}
                onChange={(event) =>
                  update({ percentage: event.target.value, amount: '' })
                }
                className={inputClass}
                placeholder="Ví dụ: 20 (giảm 20%)"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                %
              </span>
            </div>
          </div>
        )}

        {/* FIXED AMOUNT INPUT */}
        {usesAmount && (
          <div>
            <label className={labelClass}>Mức giảm (VNĐ) *</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={rule.amount}
              onChange={(event) =>
                update({ amount: event.target.value, percentage: '' })
              }
              className={inputClass}
              placeholder="Ví dụ: 10000"
              required
            />
            <span className="mt-1 block text-theme-xs font-semibold text-brand-600 dark:text-brand-400">
              Hiển thị: {formatVnd(Number(rule.amount) || 0)}
            </span>
          </div>
        )}

        {/* QUANTITY INPUT */}
        {usesQuantity && (
          <div>
            <label className={labelClass}>Số lượng tặng kèm *</label>
            <input
              type="number"
              min="1"
              step="1"
              value={rule.quantity}
              onChange={(event) => update({ quantity: event.target.value })}
              className={inputClass}
              placeholder="Mặc định: 1"
              required
            />
          </div>
        )}

        {/* MIN ORDER AMOUNT FOR RULE */}
        <div>
          <label className={labelClass}>Đơn hàng tối thiểu (VNĐ)</label>
          <input
            type="number"
            min="0"
            step="1000"
            value={rule.minOrderAmount}
            onChange={(event) =>
              update({ minOrderAmount: event.target.value })
            }
            className={inputClass}
            placeholder="Để trống nếu không yêu cầu"
          />
          {Number(rule.minOrderAmount) > 0 && (
            <span className="mt-1 block text-theme-xs font-medium text-gray-500">
              Đơn tối thiểu: {formatVnd(Number(rule.minOrderAmount))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
