import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('./AppSidebar.tsx', import.meta.url), 'utf8');

test('memoizes navigation items so submenu synchronization cannot loop on every render', () => {
  assert.match(source, /useMemo/);
  assert.match(source, /const navItems = useMemo\(\(\) => getNavItems\(\), \[user\?\.role\]\);/);
});
