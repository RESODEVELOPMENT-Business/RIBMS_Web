export type UserRole = 'Administrator' | 'BrandManager' | 'StoreManager';

export type DecodedAuthClaims = Record<string, unknown>;

const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

const asPositiveInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const getUserRoleFromClaims = (decoded: DecodedAuthClaims): UserRole | null => {
  const rawRole = decoded[roleClaim] ?? decoded.role;
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  return role === 'Administrator' || role === 'BrandManager' || role === 'StoreManager'
    ? role
    : null;
};

export const getBrandIdFromClaims = (
  decoded: DecodedAuthClaims,
  role: UserRole | null,
): number | null => {
  if (role !== 'BrandManager' && role !== 'StoreManager') return null;

  return asPositiveInteger(decoded.BrandId ?? decoded.brandId ?? decoded.ReferenceId ?? decoded.referenceId);
};

export const getAdminStoreIdFromClaims = (decoded: DecodedAuthClaims): number | null =>
  asPositiveInteger(decoded.AdminStoreId ?? decoded.adminStoreId);

export const mergeUserClaims = <T extends {
  role: UserRole;
  brandId?: number | null;
  adminStoreId?: number | null;
}>(user: T, decoded: DecodedAuthClaims): T => {
  const role = getUserRoleFromClaims(decoded);
  if (!role) return user;

  return {
    ...user,
    role,
    brandId: getBrandIdFromClaims(decoded, role),
    adminStoreId: getAdminStoreIdFromClaims(decoded),
  };
};
