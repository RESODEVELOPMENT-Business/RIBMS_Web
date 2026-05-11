'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/services/apiClient';

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = Number(params.id);

  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/product-categories/${categoryId}`);
      if (res && res.data) {
        setCategory(res.data);
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Category Detail</h1>
      </div>

      {loading ? (
        <p className="dark:text-gray-400">Loading...</p>
      ) : category ? (
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 space-y-4 text-sm">
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Category ID:</span> <span className="ml-2 dark:text-white">{category.cateId || category.id}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Brand ID:</span> <span className="ml-2 dark:text-white">{category.brandId}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Category Name:</span> <span className="ml-2 dark:text-white">{category.cateName}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Parent Category ID:</span> <span className="ml-2 dark:text-white">{category.parentCateId || 'None'}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Status:</span> 
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${category.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {category.active ? 'Active' : 'Inactive'}
            </span>
          </p>
        </div>
      ) : (
        <p className="text-red-500">Category not found</p>
      )}
    </div>
  );
}
