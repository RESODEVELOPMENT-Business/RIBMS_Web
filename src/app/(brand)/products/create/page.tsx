'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  createProduct,
  createProductDetailMapping,
  getProducts,
} from '@/services/products';
import { getProductCategories } from '@/services/productCategories';
import { getStores } from '@/services/stores';
import { useAuthStore } from '@/store/authStore';

import {
  Product,
  ProductCategory,
  ProductTypeEnum,
  PRODUCT_TYPE_OPTIONS,
} from '@/types/product';
import { Store } from '@/types/store';

function resolveCatId(
  raw: Record<string, unknown> | null,
  categories: ProductCategory[]
): number | undefined {
  if (!raw) return undefined;

  const direct = raw.catId ?? raw.CatId;
  if (direct !== null && direct !== undefined && direct !== '') {
    const numericDirect = Number(direct);
    if (Number.isFinite(numericDirect)) return numericDirect;
  }

  const name = (raw.productCategoryName ?? raw.ProductCategoryName) as
    | string
    | null
    | undefined;

  if (name && categories.length > 0) {
    const normalizedName = name.trim().toLowerCase();
    const found = categories.find(
      (item) =>
        item.categoryName?.trim().toLowerCase() === normalizedName ||
        (item.categoryNameEng && item.categoryNameEng.trim().toLowerCase() === normalizedName)
    );

    if (found) return found.id;
  }

  return undefined;
}

export default function CreateProductPage() {
  const router = useRouter();
  const brandId = useAuthStore.getState().user?.brandId;

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [parentProducts, setParentProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [selectedParentProductId, setSelectedParentProductId] = useState<string>('');
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [productType, setProductType] = useState<number>(0);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchParentProducts();
    fetchStores();
  }, []);

  const handleSetCategories = (cats: ProductCategory[]) => {
    setCategories(cats);
    setCategoriesLoaded(true);
  };

  const fetchCategories = async () => {
    try {
      const res = await getProductCategories(
        1,
        100
      );

      handleSetCategories(res.data.items || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load categories');
      setCategoriesLoaded(true);
    }
  };

  const fetchParentProducts = async () => {
    try {
      const res = await getProducts(1, 500);
      const products: Product[] = res?.data?.items || res?.data || [];
      setParentProducts(
        products.filter((item) => Number(item.productType) === ProductTypeEnum.General)
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to load parent products');
    }
  };

  const handleParentProductChange = (value: string) => {
    setSelectedParentProductId(value);

    if (!value) {
      setSelectedCategoryId('');
    }
  };

  const toggleStoreSelection = (storeId: number) => {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId]
    );
  };

  const fetchStores = async () => {
    try {
      const res = await getStores(1, 1000, brandId || undefined);
      const storeItems: Store[] = res?.data?.items || res?.data || [];
      setStores(storeItems);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load stores');
    }
  };

  useEffect(() => {
    if (!selectedParentProductId) return;

    const selectedParentProduct = parentProducts.find(
      (item) => String(item.id) === selectedParentProductId
    );

    const resolvedCatId = resolveCatId(
      selectedParentProduct ? (selectedParentProduct as unknown as Record<string, unknown>) : null,
      categories
    );

    if (resolvedCatId !== undefined) {
      setSelectedCategoryId(resolvedCatId);
    }
  }, [selectedParentProductId, parentProducts, categories]);

  const handleCreate = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const selectedProductType = Number(formData.get('ProductType'));
    const selectedGeneralProductId = formData.get('GeneralProductId');
    const price = Number(formData.get('Price'));
    const selectedCatId = Number(formData.get('CatId'));

    if (selectedStoreIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một cửa hàng');
      setLoading(false);
      return;
    }

    if (selectedProductType === ProductTypeEnum.Detail && !selectedGeneralProductId) {
      toast.error('Sản phẩm con bắt buộc phải có mã sản phẩm cha');
      setLoading(false);
      return;
    }

    const payload = {
      ProductName: formData.get('ProductName') as string,
      ProductNameEng: formData.get('ProductNameEng') as string,

      Price: price,

      CatId: selectedCatId,

      Code: formData.get('Code') as string,

      ProductType: selectedProductType,
      GeneralProductId:
        selectedProductType === ProductTypeEnum.Detail
          ? Number(selectedGeneralProductId)
          : null,

      IsAvailable: formData.get('IsAvailable') === 'on',

      Active: formData.get('Active') === 'on',
    };

    try {
      const createProductResponse = await createProduct(payload);
      const createdProduct =
        createProductResponse?.data?.data ??
        createProductResponse?.data?.Data ??
        createProductResponse?.data;
      const createdProductId =
        createdProduct?.id ??
        createdProduct?.Id ??
        createdProduct?.productId ??
        createdProduct?.ProductId;

      if (!createdProductId) {
        throw new Error('Không lấy được mã sản phẩm vừa tạo');
      }

      // Create product detail mappings for all selected stores
      const mappingPromises = selectedStoreIds.map((storeId) =>
        createProductDetailMapping({
          ProductId: Number(createdProductId),
          StoreId: storeId,
          Price: price,
          DiscountPrice: null,
          DiscountPercent: null,
          Active: true,
        })
      );

      await Promise.all(mappingPromises);

      toast.success(`Product and ${selectedStoreIds.length} store mapping(s) created successfully`);

      router.push('/products');
    } catch (err: any) {
      toast.error(err?.message || 'Create product failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create Product
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <form
          onSubmit={handleCreate}
          className="space-y-8"
        >
          <div>
            <h2 className="text-xl font-semibold mb-5 dark:text-white">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Product Name
                </label>

                <input
                  required
                  type="text"
                  name="ProductName"
                  placeholder="Product name"
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Product Name ENG
                </label>

                <input
                  type="text"
                  name="ProductNameEng"
                  placeholder="English name"
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Product Code
                </label>

                <input
                  type="text"
                  name="Code"
                  placeholder="Code"
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Price
                </label>

                <input
                  required
                  type="number"
                  step="0.01"
                  name="Price"
                  placeholder="0"
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-3 dark:text-gray-300">
                  Stores (Select multiple)
                </label>

                <div className="border rounded-lg p-3 dark:bg-gray-700 dark:border-gray-600 max-h-48 overflow-y-auto">
                  {stores.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No stores available</p>
                  ) : (
                    <div className="space-y-2">
                      {stores.map((item) => (
                        <div key={`store-${item.id}`} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`store-${item.id}`}
                            checked={selectedStoreIds.includes(item.id)}
                            onChange={() => toggleStoreSelection(item.id)}
                            className="w-4 h-4 rounded"
                          />
                          <label
                            htmlFor={`store-${item.id}`}
                            className="text-sm dark:text-gray-300 cursor-pointer flex-1"
                          >
                            {item.name || 'Unnamed Store'}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedStoreIds.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {selectedStoreIds.length} store(s) selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Category
                </label>

                <select
                  required
                  name="CatId"
                  value={selectedCategoryId === '' ? '' : String(selectedCategoryId)}
                  onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map((item) => (
                    <option
                      key={`category-${item.id}-${item.categoryName}`}
                      value={item.id}
                    >
                      {item.categoryName || 'Unnamed Category'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Product Type
                </label>

                <select
                  name="ProductType"
                  defaultValue={ProductTypeEnum.Single}
                  onChange={(e) => setProductType(Number(e.target.value))}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {PRODUCT_TYPE_OPTIONS.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  General Product Id (Parent Id)
                </label>

                <select
                  name="GeneralProductId"
                  required={productType === ProductTypeEnum.Detail}
                  disabled={productType !== ProductTypeEnum.Detail || !categoriesLoaded}
                  onChange={(e) => handleParentProductChange(e.target.value)}
                  className="w-full p-3 border rounded-lg disabled:opacity-60 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={selectedParentProductId}
                >
                  <option value="">
                    {!categoriesLoaded ? 'Loading stores...' : 'Select parent product'}
                  </option>
                  {parentProducts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.productName || 'Unnamed'} (ID: {item.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-5 dark:text-white">
              Status
            </h2>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="IsAvailable"
                  id="isAvailable"
                  defaultChecked
                  className="w-4 h-4"
                />

                <label
                  htmlFor="isAvailable"
                  className="dark:text-gray-300"
                >
                  Available
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="Active"
                  id="active"
                  defaultChecked
                  className="w-4 h-4"
                />

                <label
                  htmlFor="active"
                  className="dark:text-gray-300"
                >
                  Active
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-3 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading
                ? 'Creating...'
                : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}