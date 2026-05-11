'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getProductCategoryById, updateProductCategory } from '@/services/productCategories';

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const resolvedParams = React.use(params);

  useEffect(() => {
    fetchCategory();
  }, [resolvedParams.id]);

  const fetchCategory = async () => {
    try {
      const brandId = 1; // Get from auth store
      const res = await getProductCategoryById(resolvedParams.id, brandId);
      if (res && res.data) {
        setCategory(res.data);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      toast.error('Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      CateName: formData.get("CateName") as string,
      BrandId: Number(formData.get("BrandId")),
      ParentCateId: formData.get("ParentCateId") ? Number(formData.get("ParentCateId")) : null,
      Active: formData.get("Active") === "on",
    };
    
    try {
      await updateProductCategory(Number(resolvedParams.id), payload);
      toast.success('Category updated successfully!');
      router.push('/categories');
    } catch (err: any) {
      toast.error(`Error updating category: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 gap-4">
              {[...Array(3)].map((_, i) => (
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Category</h1>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category Name</label>
            <input 
              required 
              type="text" 
              name="CateName" 
              defaultValue={category?.cateName || ''}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Brand ID</label>
            <input 
              required 
              type="number" 
              name="BrandId" 
              defaultValue={category?.brandId || ''}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Parent Category ID (Optional)</label>
            <input 
              type="number" 
              name="ParentCateId" 
              defaultValue={category?.parentCateId || ''}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              name="Active" 
              id="active" 
              defaultChecked={category?.active} 
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
              Update Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
