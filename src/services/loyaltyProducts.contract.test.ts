import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBrandProductResponse, parseProductItemResponse } from './loyaltyProductContracts.ts';

test('normalises the brand product response for typed rule pickers', () => {
  assert.deepEqual(
    parseBrandProductResponse({
      data: {
        items: [
          { id: 101, productName: 'Cà phê sữa L', active: true },
          { productId: 102, ProductName: 'Cà phê sữa S', Active: true },
        ],
      },
    }),
    [
      { id: 101, name: 'Cà phê sữa L', active: true },
      { id: 102, name: 'Cà phê sữa S', active: true },
    ],
  );
});

test('normalises physical gift rows and keeps their ProductItem identity', () => {
  assert.deepEqual(
    parseProductItemResponse({
      data: [
        { itemId: 501, itemName: 'Mũ bảo hiểm', isAvailable: true },
      ],
    }),
    [{ id: 501, name: 'Mũ bảo hiểm', active: true }],
  );
});
