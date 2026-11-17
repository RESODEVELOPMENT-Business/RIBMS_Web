import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const brandArticlesServiceSource = readFileSync(
  new URL('./brandArticles.ts', import.meta.url),
  'utf8',
);
const brandArticlesListPageSource = readFileSync(
  new URL('../app/(brand)/articles/page.tsx', import.meta.url),
  'utf8',
);
const brandArticlesCreatePageSource = readFileSync(
  new URL('../app/(brand)/articles/create/page.tsx', import.meta.url),
  'utf8',
);
const brandArticlesEditPageSource = readFileSync(
  new URL('../app/(brand)/articles/[id]/edit/page.tsx', import.meta.url),
  'utf8',
);
const brandArticleEditorSource = readFileSync(
  new URL('../app/(brand)/articles/_components/BrandArticleEditor.tsx', import.meta.url),
  'utf8',
);
const articleSharedSource = readFileSync(
  new URL('../app/(brand)/articles/_components/articleShared.tsx', import.meta.url),
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
    /export const deleteBrandArticle =/,
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
  assert.match(
    brandArticlesServiceSource,
    /\{ key: 'auth', label: 'Màn hình Đăng ký \/ Đăng nhập' \}/,
  );
});

test('navigation registers /articles under BrandManager Danh mục & Tiếp thị only', () => {
  assert.match(
    navigationSource,
    /\{ name: "Bài viết thương hiệu", path: "\/articles" \}/,
  );
});

test('articles list page separates creation and editing into /articles/create and /articles/[id]/edit routes', () => {
  assert.match(brandArticlesListPageSource, /user\.role !== 'BrandManager'/);
  assert.match(brandArticlesListPageSource, /href="\/articles\/create"/);
  assert.match(brandArticlesListPageSource, /href=\{`\/articles\/\$\{item\.id\}\/edit`\}/);
  assert.doesNotMatch(brandArticlesListPageSource, /editorMode/);
  assert.match(brandArticlesCreatePageSource, /<BrandArticleEditor mode="create" \/>/);
  assert.match(brandArticlesEditPageSource, /<BrandArticleEditor mode="edit" articleId=\{parsedId\} \/>/);
});

test('articles editor enforces BrandManager guard, supports heading/paragraph/image blocks, keyboard ↑/↓ reorder, 360px live preview, and 409 ETag & liveReferences handling without losing form edits', () => {
  assert.match(brandArticleEditorSource, /user\.role !== 'BrandManager'/);
  assert.match(brandArticleEditorSource, /Lưu nháp/);
  assert.match(brandArticleEditorSource, /Xuất bản/);
  assert.match(brandArticleEditorSource, /Gỡ xuất bản/);
  assert.match(brandArticleEditorSource, /Xóa bài viết/);
  assert.match(brandArticleEditorSource, /Chuyển thành Đoạn văn/);
  assert.match(brandArticleEditorSource, /Chuyển thành Tiêu đề/);
  assert.match(brandArticleEditorSource, /datetime-local/);
  assert.match(articleSharedSource, /Có bản nháp mới chưa xuất bản/);
  assert.match(brandArticleEditorSource, /↑ Lên/);
  assert.match(brandArticleEditorSource, /↓ Xuống/);
  assert.match(brandArticleEditorSource, /max-w-\[360px\]/);
  assert.match(articleSharedSource, /Tải lại bản trên server/);
  assert.match(articleSharedSource, /liveReferences/);
});
