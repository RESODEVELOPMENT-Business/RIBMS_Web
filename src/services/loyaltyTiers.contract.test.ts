import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const loyaltyTiersServiceSource = readFileSync(
  new URL('./loyaltyTiers.ts', import.meta.url),
  'utf8',
);
const tierEditorSource = readFileSync(
  new URL(
    '../app/(brand)/loyalty-tiers/components/TierImageEditor.tsx',
    import.meta.url,
  ),
  'utf8',
);
const loyaltyTiersPageSource = readFileSync(
  new URL('../app/(brand)/loyalty-tiers/page.tsx', import.meta.url),
  'utf8',
);
const stampRewardEditorSource = readFileSync(
  new URL(
    '../app/(brand)/loyalty-tiers/components/StampRewardOptionEditor.tsx',
    import.meta.url,
  ),
  'utf8',
);

test('loyaltyTiers service preserves imageUrl and badgeImageUrl and posts Image, BadgeImage, RemoveImage, RemoveBadgeImage', () => {
  assert.match(loyaltyTiersServiceSource, /imageUrl\?: string \| null/);
  assert.match(loyaltyTiersServiceSource, /badgeImageUrl\?: string \| null/);
  assert.match(loyaltyTiersServiceSource, /form\.append\('Image', image\)/);
  assert.match(
    loyaltyTiersServiceSource,
    /form\.append\('BadgeImage', options\.badgeImage\)/,
  );
  assert.match(
    loyaltyTiersServiceSource,
    /form\.append\('RemoveImage', 'true'\)/,
  );
  assert.match(
    loyaltyTiersServiceSource,
    /form\.append\('RemoveBadgeImage', 'true'\)/,
  );
});

test('TierImageEditor and loyalty-tiers page manage both card background and badge artwork with WebP optimization', () => {
  assert.match(tierEditorSource, /Ảnh nền thẻ hạng/);
  assert.match(tierEditorSource, /Huy hiệu hạng \(Badge\)/);
  assert.match(tierEditorSource, /Xóa ảnh nền/);
  assert.match(tierEditorSource, /Xóa huy hiệu/);
  assert.match(loyaltyTiersPageSource, /optimizeImageForUpload/);
  assert.match(loyaltyTiersPageSource, /preset: 'badge'/);
});

test('loyalty-tiers page exposes the shared stamp reward editor — single draft, no per-tier fields', () => {
  // Page must mount the shared reward editor and load product items for the picker
  assert.match(loyaltyTiersPageSource, /<StampRewardOptionEditor/);
  assert.match(loyaltyTiersPageSource, /getBrandProductItems/);

  // Editor uses one draft (not a list of per-tier options)
  assert.doesNotMatch(
    stampRewardEditorSource,
    /selectedTier\?\.stampThreshold \?\? Number\(option\.stampRequired\)/,
    'StampRewardOptionEditor must not carry the old per-tier threshold fallback',
  );
  assert.doesNotMatch(
    stampRewardEditorSource,
    /Lấy từ đặc quyền của hạng/,
    'StampRewardOptionEditor must not expose per-tier threshold labels',
  );

  // Editor exposes only shared reward fields: type, product identity, quantity
  assert.match(stampRewardEditorSource, /rewardType/);
  assert.match(stampRewardEditorSource, /quantity/);
  assert.doesNotMatch(
    stampRewardEditorSource,
    /stampRequired|brandLoyaltyTierId|sortOrder|active/,
    'StampRewardOptionEditor must not send tier/threshold/active ownership fields',
  );
});
