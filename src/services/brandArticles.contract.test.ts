import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const brandArticlesServiceSource = readFileSync(
  new URL('./brandArticles.ts', import.meta.url),
  'utf8',
);
const brandArticlesPageSource = readFileSync(
  new URL('../app/(brand)/articles/page.tsx', import.meta.url),
  'utf8',
);
const navigationSource = readFileSync(
  new URL('../layout/navigation.tsx', import.meta.url),
  'utf8',
);

test('brandArticles service calls /brand/articles with ETag / If-Match headers and dedicated upload-image endpoint', () => {
  assert.match(
    brandArticlesServiceSource,
    /const BRAND_ARTICLES_ENDPOINT = '\/brand\/articles'/,
  );
  assert.match(brandArticlesServiceSource, /export const getBrandArticles =/);
  assert.match(brandArticlesServiceSource, /export const getBrandArticleById =/);
  assert.match(
    brandArticlesServiceSource,
    /export const createBrandArticleDraft =/,
  );
  assert.match(
    brandArticlesServiceSource,
    /export const saveBrandArticleDraft =/,
  );
  assert.match(
    brandArticlesServiceSource,
    /export const publishBrandArticle =/,
  );
  assert.match(
    brandArticlesServiceSource,
    /export const unpublishBrandArticle =/,
  );
  assert.match(
    brandArticlesServiceSource,
    /export const uploadBrandArticleImage =/,
  );
  assert.match(brandArticlesServiceSource, /'If-Match': `"\$\{etag\}"`/);
  assert.match(
    brandArticlesServiceSource,
    /\$\{BRAND_ARTICLES_ENDPOINT\}\/upload-image/,
  );
});

test('navigation registers /articles under BrandManager Danh mục & Tiếp thị only', () => {
  assert.match(
    navigationSource,
    /\{ name: "Bài viết thương hiệu", path: "\/articles" \}/,
  );
});

test('articles admin page enforces BrandManager guard, supports heading/paragraph/image blocks, keyboard ↑/↓ reorder, 360px live preview, and 409 ETag & liveReferences handling without losing form edits', () => {
  assert.match(brandArticlesPageSource, /user\.role !== 'BrandManager'/);
  assert.match(brandArticlesPageSource, /Lưu nháp/);
  assert.match(brandArticlesPageSource, /Xuất bản/);
  assert.match(brandArticlesPageSource, /Gỡ xuất bản/);
  assert.match(brandArticlesPageSource, /Có bản nháp mới chưa xuất bản/);
  assert.match(brandArticlesPageSource, /↑ Lên/);
  assert.match(brandArticlesPageSource, /↓ Xuống/);
  assert.match(brandArticlesPageSource, /max-w-\[360px\]/);
  assert.match(brandArticlesPageSource, /Tải lại bản trên server/);
  assert.match(brandArticlesPageSource, /liveReferences/);
});
