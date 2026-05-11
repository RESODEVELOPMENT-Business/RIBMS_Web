'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getProductDetailMappingById, updateProductDetailMapping } from '@/services/productDetailMappings';
import { getProducts } from '@/services/products';
import { getStores } from '@/services/stores';

export default function EditProductDetailMappingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [mapping, setMapping] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const brandId = 1; // Get from auth store
      const [mappingRes, productsRes, storesRes] = await Promise.all([
        getProductDetailMappingById(params.id, brandId),
        getProducts(1, 1000),
        getStores(1, 1000, brandId)
      ]);
      
      if (mappingRes && mappingRes.data) {
        setMapping(mappingRes.data);
      }
      if (productsRes && productsRes.data) {
        setProducts(productsRes.data.items || productsRes.data);
      }
      if (storesRes && storesRes.data) {
        setStores(storesRes.data.items || storesRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      ProductId: Number(formData.get("ProductId")),
      StoreId: Number(formData.get("StoreId")),
      Price: formData.get("Price") ? Number(formData.get("Price")) : null,
      DiscountPrice: formData.get("DiscountPrice") ? Number(formData.get("DiscountPrice")) : null,
      DiscountPercent: formData.get("DiscountPercent") ? Number(formData.get("DiscountPercent")) : null,
      Active: formData.get("Active") === "on",
    };
    
    try {
      await updateProductDetailMapping(Number(params.id), payload);
      toast.success('Product-Store mapping updated successfully!');
      router.push('/product-detail-mappings');
    } catch (err: any) {
      toast.error(`Error updating mapping: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 gap-4">
              {[...Array(5)].map((_, i) => (
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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Product-Store Mapping</h1>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Product *</label>
            <select 
              required 
              name="ProductId" 
              defaultValue={mapping?.productId || ''}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select a product</option>
              {products.map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.productName} ({product.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Store *</label>
            <select 
              required 
              name="StoreId" 
              defaultValue={mapping?.storeId || ''}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select a store</option>
              {stores.map((store: any) => (
                <option key={store.storeId} value={store.storeId}>
                  {store.storeName}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Price</label>
            <input 
              type="number" 
              step="0.01" 
              name="Price" 
              defaultValue={mapping?.price || ''}
              placeholder="Override price (optional)"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Discount Price</label>
            <input 
              type="number" 
              step="0.01" 
              name="DiscountPrice" 
              defaultValue={mapping?.discountPrice || ''}
              placeholder="Discount price (optional)"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Discount Percent</label>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              max="100"
              name="DiscountPercent" 
              defaultValue={mapping?.discountPercent || ''}
              placeholder="Discount percent (0-100)"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            />
          </div>
          
          <div className="md:col-span-2 flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              name="Active" 
              id="active" 
              defaultChecked={mapping?.active} 
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
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Update Mapping
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
