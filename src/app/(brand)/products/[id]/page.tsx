'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  getProductById,
  getProductDetailMappings,
  createProductDetailMapping,
  updateProductDetailMapping,
  deleteProductDetailMapping,
} from '@/services/products';
import { getStores } from '@/services/stores';
import { formatCurrency } from '@/utils/currency';
import {
  ProductDetailMapping,
  ProductTypeEnum,
  PRODUCT_TYPE_OPTIONS,
} from '@/types/product';

type TabKey = 'overview' | 'store-menu';

const PRODUCT_TYPE_MAP: Record<number, string> = Object.fromEntries(
  PRODUCT_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // ─── Store Mapping state ───
  const [mappings, setMappings] = useState<ProductDetailMapping[]>([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);

  // Add mapping modal
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [newMappingStoreId, setNewMappingStoreId] = useState<number | ''>('');
  const [newMappingPrice, setNewMappingPrice] = useState<string>('');
  const [newMappingDiscount, setNewMappingDiscount] = useState<string>('');
  const [addingMapping, setAddingMapping] = useState(false);

  useEffect(() => {
    if (productId) fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (activeTab === 'store-menu' && mappings.length === 0) {
      fetchMappings();
      fetchStores();
    }
  }, [activeTab, mappings.length]);

  // ─── Fetchers ───

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await getProductById(productId);
      if (res && res.data) {
        setProduct(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMappings = async () => {
    setMappingsLoading(true);
    try {
      const res = await getProductDetailMappings(1, 200, undefined, productId);
      if (res && res.data) {
        setMappings(res.data.items || res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMappingsLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await getStores(1, 200);
      if (res && res.data) {
        setStores(res.data.items || res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Handlers ───

  const handleAddMapping = async () => {
    if (!newMappingStoreId) {
      toast.error('Please select a store');
      return;
    }
    setAddingMapping(true);
    try {
      await createProductDetailMapping({
        ProductId: productId,
        StoreId: Number(newMappingStoreId),
        Price: newMappingPrice ? Number(newMappingPrice) : null,
        DiscountPrice: newMappingDiscount ? Number(newMappingDiscount) : null,
        Active: true,
      });
      toast.success('Store mapping created!');
      setShowAddMapping(false);
      setNewMappingStoreId('');
      setNewMappingPrice('');
      setNewMappingDiscount('');
      fetchMappings();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setAddingMapping(false);
    }
  };

  const handleToggleMapping = async (mapping: ProductDetailMapping) => {
    try {
      await updateProductDetailMapping(mapping.productDetailId, {
        Active: !mapping.active,
      });
      toast.success('Mapping updated!');
      fetchMappings();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleDeleteMapping = async (id: number) => {
    if (!window.confirm('Delete this store mapping?')) return;
    try {
      await deleteProductDetailMapping(id);
      toast.success('Mapping deleted!');
      fetchMappings();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  // ─── UI Helpers ───

  const tabClasses = (key: TabKey) =>
    `px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
      activeTab === key
        ? 'bg-brand-500 text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`;

  const inputCls =
    'w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-colors';
  const labelCls = 'block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300';

  // ─── Render ───

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-red-500">Product not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-brand-500 hover:underline">← Back</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.push('/products')}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          &larr; Back
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {product.productName || product.ProductName}
          </h1>
          <p className="text-sm text-gray-400 font-mono">
            {product.code || product.Code || 'No code'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/products/${productId}/edit`)}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium"
          >
            Edit Product
          </button>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              product.active
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {product.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b dark:border-gray-700 pb-2">
        <button className={tabClasses('overview')} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={tabClasses('store-menu')} onClick={() => setActiveTab('store-menu')}>
          Store Menu ({mappings.length})
        </button>
      </div>

      {/* ─── Tab: Overview ─── */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <InfoRow label="Product ID" value={product.id} />
            <InfoRow
              label="Product Type"
              value={
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {PRODUCT_TYPE_MAP[product.productType ?? 0] || `Type ${product.productType}`}
                </span>
              }
            />
            <InfoRow label="Code" value={product.code || '—'} />
            <InfoRow
              label="Price"
              value={
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(product.price)}
                </span>
              }
            />
            <InfoRow label="Category" value={product.productCategoryName || `#${product.catId ?? '—'}`} />
            <InfoRow label="Category ID" value={product.catId ?? '—'} />
            <InfoRow label="Available" value={product.isAvailable ? 'Yes' : 'No'} />
            <InfoRow label="Active" value={product.active ? 'Yes' : 'No'} />
            {product.generalProductId && (
              <InfoRow label="Parent Product ID" value={product.generalProductId} />
            )}
            {Number(product.productType) === ProductTypeEnum.Detail && (
              <InfoRow label="Variant / Detail Product" value="Yes" />
            )}
            {product.description && (
              <div className="md:col-span-2">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Description</span>
                <p className="mt-1 text-gray-800 dark:text-white whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: Store Menu ─── */}
      {activeTab === 'store-menu' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddMapping(!showAddMapping)}
              className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors"
            >
              {showAddMapping ? '✕ Cancel' : '+ Add Store Mapping'}
            </button>
          </div>

          {showAddMapping && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                Assign to Store
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Store *</label>
                  <select
                    className={inputCls}
                    value={newMappingStoreId}
                    onChange={(e) => setNewMappingStoreId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">Select store</option>
                    {stores.map((s: any) => (
                      <option key={s.id || s.storeId} value={s.id || s.storeId}>
                        {s.name || s.storeName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Override Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className={inputCls}
                    value={newMappingPrice}
                    onChange={(e) => setNewMappingPrice(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className={labelCls}>Discount Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className={inputCls}
                    value={newMappingDiscount}
                    onChange={(e) => setNewMappingDiscount(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddMapping}
                    disabled={addingMapping}
                    className="w-full px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    {addingMapping ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            {mappingsLoading ? (
              <div className="p-6 text-center text-gray-400">Loading store mappings…</div>
            ) : mappings.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Store</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Discount</th>
                    <th className="px-5 py-3">Discount %</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {mappings.map((m) => (
                    <tr key={m.productDetailId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {m.productDetailId}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">
                        {(m as any).storeName || (m.store as any)?.name || `Store #${m.storeId}`}
                      </td>
                      <td className="px-5 py-3">
                        {m.price != null ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(m.price)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {m.discountPrice != null ? (
                          <span className="text-red-500 font-medium">{formatCurrency(m.discountPrice)}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {m.discountPercent ? (
                          <span className="text-red-600 font-semibold">-{m.discountPercent}%</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            m.active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}
                        >
                          {m.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleToggleMapping(m)}
                            className={`text-xs font-medium ${
                              m.active
                                ? 'text-amber-500 hover:text-amber-700'
                                : 'text-green-500 hover:text-green-700'
                            } transition-colors`}
                          >
                            {m.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteMapping(m.productDetailId)}
                            className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-400">
                No store mappings yet. Add one above.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      <div className="mt-0.5 text-gray-800 dark:text-white">{typeof value === 'string' || typeof value === 'number' ? String(value) : value}</div>
    </div>
  );
}
