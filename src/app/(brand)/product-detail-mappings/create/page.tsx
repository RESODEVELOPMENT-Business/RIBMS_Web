'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createProductDetailMapping } from '@/services/productDetailMappings';
import { getProducts } from '@/services/products';
import { getStores } from '@/services/stores';
import { useAuthStore } from '@/store/authStore';
import { Product } from '@/types/product';
import { Store } from '@/types/store';

export default function CreateProductDetailMappingPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const brandId = useAuthStore.getState().user?.brandId;
      const [productsRes, storesRes] = await Promise.all([
        getProducts(1, 1000),
        getStores(1, 1000, brandId || undefined)
      ]);
      
      if (productsRes && productsRes.data) {
        setProducts(productsRes.data.items || productsRes.data);
      }
      if (storesRes && storesRes.data) {
        setStores(storesRes.data.items || storesRes.data);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
      toast.error('Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const price = formData.get("Price") ? Number(formData.get("Price")) : null;
    const discountPrice = formData.get("DiscountPrice") ? Number(formData.get("DiscountPrice")) : null;
    
    // Validation: Discount price cannot exceed original price
    if (discountPrice && price && discountPrice > price) {
      toast.error('Discount price cannot exceed original price');
      setSubmitting(false);
      return;
    }
    
    const payload = {
      ProductId: Number(formData.get("ProductId")),
      StoreId: Number(formData.get("StoreId")),
      Price: price,
      DiscountPrice: discountPrice,
      DiscountPercent: null, // Will be calculated by BE
      Active: formData.get("Active") === "on",
    };
    
    try {
      await createProductDetailMapping(payload);
      toast.success('Product-Store mapping created successfully!');
      router.push('/product-detail-mappings');
    } catch (err: any) {
      toast.error(`Error creating mapping: ${err.message}`);
    } finally {
      setSubmitting(false);
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Create New Product-Store Mapping</h1>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Product *</label>
                <select 
                  required 
                  name="ProductId" 
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select a product</option>
                  {products.map((product: Product) => (
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
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select a store</option>
                  {stores.map((store: Store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Price</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="Price" 
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
                  placeholder="Discount price (optional)"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              name="Active" 
              id="active" 
              defaultChecked={true} 
              className="w-4 h-4 text-blue-600" 
            />
            <label htmlFor="active" className="text-sm font-medium dark:text-gray-300">Active</label>
          </div>
          
          <div className="flex justify-end gap-2">
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
              {submitting ? 'Creating...' : 'Create Mapping'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
