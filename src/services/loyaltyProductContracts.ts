export interface LoyaltyProductOption {
  id: number;
  name: string;
  active: boolean;
}

const unwrapRows = (response: unknown): unknown[] => {
  if (!response || typeof response !== 'object') return [];
  const root = response as { data?: unknown };
  const data = root.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const paged = data as { items?: unknown; data?: unknown };
    if (Array.isArray(paged.items)) return paged.items;
    if (Array.isArray(paged.data)) return paged.data;
  }
  return [];
};

const readField = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
};

const toOption = (row: unknown, idKeys: string[], nameKeys: string[], activeKeys: string[]) => {
  if (!row || typeof row !== 'object') return null;
  const record = row as Record<string, unknown>;
  const id = Number(readField(record, ...idKeys));
  const name = String(readField(record, ...nameKeys) ?? '').trim();
  const activeValue = readField(record, ...activeKeys);
  const active = activeValue === undefined ? true : Boolean(activeValue);
  if (!Number.isInteger(id) || id <= 0 || !name) return null;
  return { id, name, active } satisfies LoyaltyProductOption;
};

export const parseBrandProductResponse = (response: unknown): LoyaltyProductOption[] =>
  unwrapRows(response)
    .map((row) => toOption(row, ['id', 'productId', 'Id', 'ProductId'], ['productName', 'ProductName', 'name', 'Name'], ['active', 'Active', 'isAvailable', 'IsAvailable']))
    .filter((item): item is LoyaltyProductOption => item !== null);

export const parseProductItemResponse = (response: unknown): LoyaltyProductOption[] =>
  unwrapRows(response)
    .map((row) => toOption(row, ['itemId', 'ItemId', 'id', 'Id'], ['itemName', 'ItemName', 'name', 'Name'], ['isAvailable', 'IsAvailable', 'active', 'Active']))
    .filter((item): item is LoyaltyProductOption => item !== null);
