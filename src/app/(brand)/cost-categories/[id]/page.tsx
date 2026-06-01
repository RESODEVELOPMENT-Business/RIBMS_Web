'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getCostCategoryById, CostCategory, CostCategoryType } from '@/services/costs';

const unwrapItem = <T,>(payload: any): T | null => {
  const data = payload?.data ?? payload;

  if (data && typeof data === 'object') {
    return data as T;
  }

  return null;
};

const typeLabel = (type: CostCategoryType | null | undefined) => (type === 1 ? '% doanh thu' : 'VND');

export default function CostCategoryDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const categoryId = params?.id;

  const [category, setCategory] = useState<CostCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;
    fetchData();
  }, [categoryId]);

  const fetchData = async () => {
    try {
      const res = await getCostCategoryById(categoryId);
      setCategory(unwrapItem<CostCategory>(res));
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải chi tiết danh mục chi phí');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          &larr; Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Chi tiết danh mục chi phí</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Xem thông tin và trạng thái danh mục.</p>
        </div>
      </div>

      {loading ? (
        <p className="dark:text-gray-400">Loading...</p>
      ) : category ? (
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 space-y-4 text-sm">
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Category ID:</span> <span className="ml-2 dark:text-white">{category.catId}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Brand ID:</span> <span className="ml-2 dark:text-white">{category.brandId ?? 'Shared'}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Category Name:</span> <span className="ml-2 dark:text-white">{category.catName}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Type:</span> <span className="ml-2 dark:text-white">{typeLabel(category.type)}</span></p>
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