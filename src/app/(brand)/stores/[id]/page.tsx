'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/services/apiClient';

export default function StoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = Number(params.id);

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      fetchData();
    }
  }, [storeId]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/stores/${storeId}`);
      if (res && res.data) {
        setStore(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Store Detail</h1>
      </div>

      {loading ? (
        <p className="dark:text-gray-400">Loading...</p>
      ) : store ? (
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 space-y-4 text-sm">
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Store ID:</span> <span className="ml-2 dark:text-white">{store.storeId || store.id}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Brand ID:</span> <span className="ml-2 dark:text-white">{store.brandId}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Store Name:</span> <span className="ml-2 dark:text-white">{store.name}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Short Name:</span> <span className="ml-2 dark:text-white">{store.shortName || 'N/A'}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Address:</span> <span className="ml-2 dark:text-white">{store.address || 'N/A'}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Phone:</span> <span className="ml-2 dark:text-white">{store.phone || 'N/A'}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Status:</span> 
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${store.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {store.active ? 'Active' : 'Inactive'}
            </span>
          </p>
        </div>
      ) : (
        <p className="text-red-500">Store not found</p>
      )}
    </div>
  );
}
