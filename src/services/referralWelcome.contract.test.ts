import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const webRoot = path.resolve(import.meta.dirname, '..', '..');

test('navigation registers /welcome-vouchers under BrandManager Danh mục & Tiếp thị', () => {
  const nav = fs.readFileSync(path.join(webRoot, 'src', 'layout', 'navigation.tsx'), 'utf8');
  assert.match(nav, /name:\s*["']Voucher chào mừng["'],\s*path:\s*["']\/welcome-vouchers["']/);
  assert.match(nav, /name:\s*["']Giới thiệu bạn bè["'],\s*path:\s*["']\/referral-program["']/);
});

test('welcome-vouchers page targets /brand/welcome-voucher with concurrency version and preview', () => {
  const page = fs.readFileSync(
    path.join(webRoot, 'src', 'app', '(brand)', 'welcome-vouchers', 'page.tsx'),
    'utf8'
  );
  assert.match(page, /const endpoint = '\/brand\/welcome-voucher'/);
  assert.match(page, /method:\s*'PUT'/);
  assert.match(page, /isConfigured/);
  assert.match(page, /voucherCount/);
});

test('referral-program page supports analytics tab, milestone delete with hasGrants lock, and hides header submit on analytics tab', () => {
  const page = fs.readFileSync(
    path.join(webRoot, 'src', 'app', '(brand)', 'referral-program', 'page.tsx'),
    'utf8'
  );
  assert.match(page, /activeTab === 'config'/);
  assert.match(page, /activeTab === 'analytics'/);
  assert.match(page, /\/milestones\/\$\{item\.id\}/);
  assert.match(page, /item\.hasGrants/);
  assert.match(page, /\/stats\?top=10/);
  assert.match(page, /\/referrals\?/);
  assert.match(page, /\/grants\?/);
});
