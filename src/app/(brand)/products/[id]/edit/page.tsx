'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { getProductById, getProducts, updateProduct } from '@/services/products';
import { getProductCategories } from '@/services/productCategories';
import { Product, ProductCategory, ProductTypeEnum, PRODUCT_TYPE_OPTIONS } from '@/types/product';

function resolveCatId(
  raw: Product | null | undefined,
  categories: ProductCategory[]
): number | undefined {
  if (!raw) return undefined;
  const direct = raw.catId;
  if (direct !== null && direct !== undefined) {
    const n = Number(direct);
    if (Number.isFinite(n)) return n;
  }
  const name = (raw.productCategoryName) as
    | string
    | null
    | undefined;
  if (name && categories.length > 0) {
    const found = categories.find(
      (c) =>
        c.categoryName === name ||
        (c.categoryNameEng && c.categoryNameEng === name)
    );
    if (found) return found.id;
  }
  return undefined;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const [product, setProduct] = useState<Product>();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [parentProducts, setParentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productType, setProductType] = useState<number>(0);
  const [selectedCatId, setSelectedCatId] = useState<string>('');

  useEffect(() => {
    if (!productId) return;
    fetchProduct();
    fetchParentProducts();
    fetchCategories();
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    const cid = resolveCatId(product, categories);
    if (cid !== undefined) setSelectedCatId(String(cid));
  }, [product, categories]);

  const fetchProduct = async () => {
    if (!productId) return;
    try {
      const res = await getProductById(productId);
      if (res && res.data) {
        const p = res.data as Product;
        setProduct(p);
        setProductType(Number(p.productType));
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      setProduct(undefined);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getProductCategories(1, 200);
      setCategories(res?.data?.items ?? res?.data ?? []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
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
      console.error('Error fetching parent products:', error);
      toast.error('Failed to load parent products');
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const selectedProductType = Number(formData.get('productType'));
    const selectedGeneralProductId = formData.get('generalProductId');

    if (selectedProductType === ProductTypeEnum.Detail && !selectedGeneralProductId) {
      toast.error('Sản phẩm con bắt buộc phải có mã sản phẩm cha');
      setSubmitting(false);
      return;
    }

    const catFromForm = formData.get("catId");
    const catIdVal =
      Number(catFromForm) ||
      (selectedCatId ? Number(selectedCatId) : NaN);
    if (!Number.isFinite(catIdVal) || catIdVal <= 0) {
      toast.error('Please select a category');
      setSubmitting(false);
      return;
    }

    // Always use FormData (API expects multipart/form-data)
    const payload = new FormData();
    payload.append("productName", formData.get("productName") as string);
    payload.append("price", formData.get("price") as string);
    payload.append("catId", String(catIdVal));

    const code = formData.get("code") as string;
    if (code) {
      payload.append("code", code);
    }

    payload.append("productType", String(selectedProductType));

    if (selectedProductType === ProductTypeEnum.Detail && selectedGeneralProductId) {
      payload.append("generalProductId", String(selectedGeneralProductId));
    }

    payload.append("active", formData.get("active") === "on" ? "true" : "false");

    const imageFile = formData.get('imageFile') as File;
    if (imageFile && imageFile.size > 0) {
      payload.append('imageFile', imageFile);
    } else {
      payload.append('imageFile', '');
    }

    try {
      if (!productId) {
        toast.error('Missing product id');
        setSubmitting(false);
        return;
      }
      await updateProduct(Number(productId), payload);
      toast.success('Product updated successfully!');
      router.push('/products');
    } catch (err: any) {
      toast.error(`Error updating product: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const catIdNum = resolveCatId(product, categories);
  const categoryOptions: ProductCategory[] = (() => {
    if (catIdNum === undefined) return categories;
    const exists = categories.some((c) => c.id === catIdNum);
    if (exists) return categories;
    return [
      ...categories,
      {
        id: catIdNum,
        categoryName: `Category #${catIdNum} (not in current list)`,
        categoryNameEng: '',
        type: 0,
        isDisplayed: true,
        isDisplayedWebsite: true,
        isExtra: false,
        displayOrder: 0,
        adjustmentNote: '',
        seoName: '',
        seoKeyword: '',
        seoDescription: '',
        imageFontAwsomeCss: '',
        picUrl: '',
        bannerUrl: '',
        description: '',
        descriptionEng: '',
        bannerDescription: '',
        bannerDescriptionEng: '',
        active: true,
      } satisfies ProductCategory,
    ];
  })();

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-red-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Product</h1>
      </div>

      <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Product Name</label>
            <input
              required
              type="text"
              name="productName"
              defaultValue={(product?.productName as string)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Product Code</label>
            <input
              type="text"
              name="code"
              defaultValue={(product?.code)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Product Image (Optional)</label>
            <input
              type="file"
              name="imageFile"
              accept="image/*"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {product?.picUrl && (
              <p className="text-xs text-blue-500 mt-1">Current image exists</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Price</label>
            <input
              required
              type="number"
              step="0.01"
              name="price"
              defaultValue={Number(product?.price)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category</label>
            {(() => {
              const savedName = product.productCategoryName;
              return typeof savedName === 'string' && savedName.trim() !== '' ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Current: {savedName}
                </p>
              ) : null;
            })()}
            <select
              required
              name="catId"
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select category</option>
              {categoryOptions.map((item) => (
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
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Product Type</label>
            <select
              name="productType"
              value={productType}
              onChange={(e) => setProductType(Number(e.target.value))}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {PRODUCT_TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">General Product Id (Parent Id)</label>
            <select
              name="generalProductId"
              defaultValue={(product?.generalProductId ?? '') as number | ''}
              required={productType === ProductTypeEnum.Detail}
              disabled={productType !== ProductTypeEnum.Detail}
              className="w-full p-2 border rounded disabled:opacity-60 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select parent product</option>
              {parentProducts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.productName || 'Unnamed'} (ID: {item.id})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              name="active"
              id="active"
              defaultChecked={Boolean(product?.active)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="active" className="text-sm font-medium dark:text-gray-300">Active</label>
          </div>
          <div className="md:col-span-2 mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
