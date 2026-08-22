export type RewardTrigger = 1 | 2 | 3;
export type RewardType = 1 | 2 | 3 | 4;

export const defaultRewardPolicyValidityDays = (trigger: RewardTrigger) =>
  trigger === 1 ? 0 : 30;

export interface RewardRuleForm {
  displayOrder: number;
  rewardType: RewardType;
  productId: number | string | null;
  productItemId: number | string | null;
  percentage: number | string;
  amount: number | string;
  quantity: number | string;
  minOrderAmount: number | string;
  valueMode?: 'percentage' | 'amount';
  assetType?: 'product' | 'physical';
}

export interface RewardPolicyForm {
  id?: number;
  tierId: number;
  policyCode: string;
  trigger: RewardTrigger;
  rewardType: RewardType;
  monthlyCount: number | string;
  validityDays: number | string;
  minOrderAmount: number | string;
  active: boolean;
  rules: RewardRuleForm[];
}

export interface LoyaltyRewardRulePayload {
  displayOrder: number;
  rewardType: RewardType;
  productId: number | null;
  productItemId: number | null;
  percentageBasisPoints: number | null;
  amount: number | null;
  quantity: number | null;
  minOrderAmount: number | null;
}

export interface LoyaltyRewardPolicyPayload {
  id?: number;
  tierId: number;
  policyCode: string;
  trigger: RewardTrigger;
  rewardType: RewardType;
  monthlyCount: number;
  validityDays: number;
  minOrderAmount: number;
  active: boolean;
  rules: LoyaltyRewardRulePayload[];
}

const parseNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value.replace(/[,_\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const parseInteger = (value: number | string | null | undefined) => {
  const parsed = parseNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
};

const parseId = (value: number | string | null | undefined) => {
  const parsed = parseInteger(value);
  return parsed && parsed > 0 ? parsed : null;
};

export const percentageToBasisPoints = (value: number | string) => {
  const percentage = parseNumber(value);
  if (percentage === null || percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100.');
  }

  const basisPoints = Math.round(percentage * 100);
  if (!Number.isInteger(basisPoints)) {
    throw new Error('Percentage must use at most two decimal places.');
  }
  return basisPoints;
};

export const createEmptyRewardRule = (displayOrder: number): RewardRuleForm => ({
  displayOrder,
  rewardType: 1,
  productId: null,
  productItemId: null,
  percentage: '',
  amount: '',
  quantity: '1',
  minOrderAmount: '',
});

export const buildRewardPolicyPayload = (form: RewardPolicyForm): LoyaltyRewardPolicyPayload => ({
  ...(form.id ? { id: form.id } : {}),
  tierId: form.tierId,
  policyCode: form.policyCode.trim(),
  trigger: form.trigger,
  rewardType: form.rewardType,
  monthlyCount: parseInteger(form.monthlyCount) ?? 0,
  validityDays: parseInteger(form.validityDays) ?? 0,
  minOrderAmount: parseNumber(form.minOrderAmount) ?? 0,
  active: form.active,
  rules: form.rules.map((rule, index) => {
    const percentage = String(rule.percentage).trim() === '' ? null : percentageToBasisPoints(rule.percentage);
    return {
      displayOrder: index,
      rewardType: rule.rewardType,
      productId: parseId(rule.productId),
      // Physical ProductItems are reserved for stamp reward claims. Voucher
      // policies are executed against catalog Products by the checkout path.
      productItemId: null,
      percentageBasisPoints: percentage,
      amount: parseNumber(rule.amount),
      quantity: rule.rewardType === 4
        ? parseInteger(rule.quantity) ?? 1
        : rule.quantity !== '' && rule.quantity !== '1'
          ? parseInteger(rule.quantity)
          : null,
      minOrderAmount: parseNumber(rule.minOrderAmount),
    };
  }),
});
