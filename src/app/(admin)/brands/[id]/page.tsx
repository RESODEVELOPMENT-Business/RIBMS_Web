'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getStores } from '@/services/stores';
import Link from 'next/link';
import { api } from '@/services/apiClient';

export default function BrandDetailPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = Number(params.id);

  const [brand, setBrand] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (brandId) {
      fetchData();
    }
  }, [brandId]);

  const fetchData = async () => {
    try {
      // Assuming GET /api/v1/brands/{id}
      const brandRes = await api.get(`/brands/${brandId}`);
      if (brandRes && brandRes.data) {
        setBrand(brandRes.data);
      }
      
      // Fetch stores filtered by brandId from the server
      const storesRes = await getStores(1, 100, brandId);
      if (storesRes && storesRes.data) {
        setStores(storesRes.data.items || storesRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Brand Detail</h1>
      </div>

      {loading ? (
        <p className="dark:text-gray-400">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Brand Info */}
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2 dark:text-white dark:border-gray-700">Brand Information</h2>
            {brand ? (
              <div className="space-y-3 text-sm">
                <p><span className="text-gray-500 dark:text-gray-400">ID:</span> <span className="font-medium dark:text-gray-200">{brand.brandId || brand.id}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">Name:</span> <span className="font-medium dark:text-gray-200">{brand.brandName || brand.name}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">Company:</span> <span className="font-medium dark:text-gray-200">{brand.companyName || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">Contact:</span> <span className="font-medium dark:text-gray-200">{brand.contactPerson || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">Phone:</span> <span className="font-medium dark:text-gray-200">{brand.phoneNumber || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">Status:</span> 
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${brand.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {brand.active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-red-500">Brand not found</p>
            )}
          </div>

          {/* Stores List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-white">Stores in this Brand</h2>
              <Link href="/stores/create" className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors">
                + Add Store
              </Link>
            </div>
            
            {stores.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No stores found for this brand.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Store ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Phone</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {stores.map((s) => (
                      <tr key={s.id || s.storeId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm dark:text-gray-300">{s.id || s.storeId}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium dark:text-gray-200">{s.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{s.phone || 'N/A'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                          <Link href={`/stores/${s.id || s.storeId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
