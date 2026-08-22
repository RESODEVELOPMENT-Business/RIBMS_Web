import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRewardPolicyPayload,
  createEmptyRewardRule,
  defaultRewardPolicyValidityDays,
  percentageToBasisPoints,
} from './loyaltyRewardContracts.ts';

test('builds a typed policy with ordered product rules and no client brand id', () => {
  const payload = buildRewardPolicyPayload({
    id: 7,
    tierId: 15,
    policyCode: 'BIRTHDAY-GOLD',
    trigger: 2,
    rewardType: 1,
    monthlyCount: 0,
    validityDays: 7,
    minOrderAmount: 100_000,
    active: true,
    rules: [
      {
        ...createEmptyRewardRule(0),
        rewardType: 3,
        productId: 101,
        percentage: '10',
        minOrderAmount: '50_000',
      },
      {
        ...createEmptyRewardRule(1),
        rewardType: 2,
        productId: 102,
        amount: '5_000',
        quantity: '2',
      },
    ],
  });

  assert.deepEqual(payload, {
    id: 7,
    tierId: 15,
    policyCode: 'BIRTHDAY-GOLD',
    trigger: 2,
    rewardType: 1,
    monthlyCount: 0,
    validityDays: 7,
    minOrderAmount: 100_000,
    active: true,
    rules: [
      {
        displayOrder: 0,
        rewardType: 3,
        productId: 101,
        productItemId: null,
        percentageBasisPoints: 1000,
        amount: null,
        quantity: null,
        minOrderAmount: 50_000,
      },
      {
        displayOrder: 1,
        rewardType: 2,
        productId: 102,
        productItemId: null,
        percentageBasisPoints: null,
        amount: 5_000,
        quantity: 2,
        minOrderAmount: null,
      },
    ],
  });

  assert.equal('brandId' in payload, false);
});

test('converts user percentages into basis points without floating point drift', () => {
  assert.equal(percentageToBasisPoints('20'), 2000);
  assert.equal(percentageToBasisPoints('7.5'), 750);
  assert.throws(() => percentageToBasisPoints('100.01'), /between 0 and 100/);
});

test('uses end-of-month expiry as the default for monthly policies', () => {
  assert.equal(defaultRewardPolicyValidityDays(1), 0);
  assert.equal(defaultRewardPolicyValidityDays(2), 30);
});

test('keeps voucher policy rewards scoped to catalog Products', () => {
  const payload = buildRewardPolicyPayload({
    tierId: 15,
    policyCode: 'UPGRADE-GOLD',
    trigger: 3,
    rewardType: 4,
    monthlyCount: 0,
    validityDays: 30,
    minOrderAmount: 0,
    active: true,
    rules: [{
      ...createEmptyRewardRule(0),
      rewardType: 4,
      productId: 101,
      productItemId: 9001,
      quantity: 1,
    }],
  });

  assert.equal(payload.rules[0].productId, 101);
  assert.equal(payload.rules[0].productItemId, null);
});
