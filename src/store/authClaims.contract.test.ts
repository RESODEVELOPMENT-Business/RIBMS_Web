import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getBrandIdFromClaims,
  getUserRoleFromClaims,
  mergeUserClaims,
} from './authClaims.ts';

const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

test('reads BrandManager role and ReferenceId from the backend JWT claim shape', () => {
  const claims = {
    [roleClaim]: 'BrandManager',
    ReferenceId: '16',
  };

  const role = getUserRoleFromClaims(claims);

  assert.equal(role, 'BrandManager');
  assert.equal(getBrandIdFromClaims(claims, role), 16);
});

test('refreshes a persisted session brand from the current JWT', () => {
  const persistedUser = {
    id: 'user-1',
    email: 'user1@example.com',
    fullName: 'Brand Manager',
    role: 'BrandManager' as const,
    brandId: null,
    adminStoreId: null,
  };

  const hydrated = mergeUserClaims(persistedUser, {
    role: 'BrandManager',
    BrandId: '17',
    AdminStoreId: '3',
  });

  assert.equal(hydrated.brandId, 17);
  assert.equal(hydrated.adminStoreId, 3);
});

test('does not assign a brand to an Administrator session', () => {
  const claims = { role: 'Administrator', BrandId: '15' };

  assert.equal(getUserRoleFromClaims(claims), 'Administrator');
  assert.equal(getBrandIdFromClaims(claims, 'Administrator'), null);
});
