import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const stampServiceSource = readFileSync(
  new URL('./stampPrograms.ts', import.meta.url),
  'utf8',
);
const rewardEditorSource = readFileSync(
  new URL(
    '../app/(brand)/loyalty-tiers/components/StampRewardOptionEditor.tsx',
    import.meta.url,
  ),
  'utf8',
);
const createProgramSource = readFileSync(
  new URL('../app/(brand)/stamp-programs/create/page.tsx', import.meta.url),
  'utf8',
);
const editProgramSource = readFileSync(
  new URL('../app/(brand)/stamp-programs/[id]/page.tsx', import.meta.url),
  'utf8',
);
const programListSource = readFileSync(
  new URL('../app/(brand)/stamp-programs/page.tsx', import.meta.url),
  'utf8',
);

const interfaceBody = (source: string, name: string) => {
  const match = source.match(
    new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`),
  );
  assert.ok(match, `Missing ${name} interface`);
  return match[1];
};

const mustContain = (source: string, pattern: RegExp, message: string) =>
  assert.ok(pattern.test(source), message);

const mustNotContain = (source: string, pattern: RegExp, message: string) =>
  assert.ok(!pattern.test(source), message);

test('stamp service exposes effective program and shared reward endpoints', () => {
  mustContain(stampServiceSource, /getEffectiveStampProgram/, 'Missing getEffectiveStampProgram service');
  mustContain(stampServiceSource, /\/admin\/stamp-programs\/effective/, 'Missing effective program endpoint');
  mustContain(stampServiceSource, /getSharedStampReward/, 'Missing getSharedStampReward service');
  mustContain(stampServiceSource, /\/admin\/stamp-programs\/\$\{id\}\/shared-reward/, 'Missing shared reward endpoint');
  mustContain(stampServiceSource, /updateSharedStampReward/, 'Missing updateSharedStampReward service');
  mustContain(stampServiceSource, /method: 'PUT'/, 'Shared reward update must use PUT');
});

test('shared reward PUT contract contains only reward identity and quantity', () => {
  const body = interfaceBody(stampServiceSource, 'SharedStampRewardUpsertData');
  mustContain(body, /rewardType: number/, 'Shared reward payload must contain rewardType');
  mustContain(body, /productId\?: number \| null/, 'Shared reward payload must contain productId');
  mustContain(body, /productItemId\?: number \| null/, 'Shared reward payload must contain productItemId');
  mustContain(body, /quantity: number/, 'Shared reward payload must contain quantity');
  mustNotContain(
    body,
    /brandId|brandLoyaltyTierId|tierId|stampRequired|threshold|active|sortOrder/i,
    'Shared reward payload contains an authoritative field owned by Backend/tier/program',
  );
});

test('loyalty tier reward editor owns exactly one shared reward draft', () => {
  mustNotContain(
    rewardEditorSource,
    /setOptions|options\.map|emptyOption|Thêm mốc đổi quà|Mốc quà #/,
    'Reward editor still supports multiple reward options',
  );
  mustNotContain(
    rewardEditorSource,
    /stampRequired|brandLoyaltyTierId|sortOrder|Kích hoạt mốc quà|Hạng áp dụng|Tem cần đổi/,
    'Reward editor still exposes tier/threshold/order/active ownership',
  );
  mustContain(rewardEditorSource, /rewardType/, 'Single reward editor must expose rewardType');
  mustContain(rewardEditorSource, /quantity/, 'Single reward editor must expose quantity');
});

test('reward editor reads effective program and never creates a program implicitly', () => {
  mustContain(rewardEditorSource, /getEffectiveStampProgram/, 'Editor must read the effective program endpoint');
  mustContain(rewardEditorSource, /getSharedStampReward/, 'Editor must read the shared reward endpoint');
  mustContain(rewardEditorSource, /updateSharedStampReward/, 'Editor must update through the shared reward endpoint');
  mustNotContain(rewardEditorSource, /createStampProgram|updateStampProgram/, 'Editor must not create or update stamp programs');
  mustContain(rewardEditorSource, /href=["']\/stamp-programs["']/, 'Missing-program state must link to /stamp-programs');
});

test('stamp program create and edit forms do not own reward tiers', () => {
  mustNotContain(createProgramSource, /rewardTiers|CreateRewardTierData/, 'Create program form still owns reward tiers');
  mustNotContain(editProgramSource, /rewardTiers|CreateRewardTierData/, 'Edit program form still owns reward tiers');
  const createContract = interfaceBody(stampServiceSource, 'CreateStampProgramData');
  mustNotContain(createContract, /rewardTiers/i, 'CreateStampProgramData still accepts rewardTiers');
});

test('stamp program list does not present configurable reward thresholds', () => {
  mustNotContain(programListSource, /row\.original\.rewardTiers/, 'Program list still renders configured reward tiers');
  mustContain(programListSource, /Ngưỡng theo hạng/, 'Program list must explain that thresholds come from loyalty tiers');
});
