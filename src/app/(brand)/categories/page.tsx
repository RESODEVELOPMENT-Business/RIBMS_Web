'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getProductCategories, deleteProductCategory } from '@/services/productCategories';
import { useAuthStore } from '@/store/authStore';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { ColumnDef } from '@tanstack/react-table';
import { PencilIcon, TrashBinIcon } from '@/icons';

export default function ProductCategoryListPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const brandId = useAuthStore.getState().user?.brandId;
      const res = await getProductCategories(1, 100, brandId || undefined);
      if (res && res.data) {
          setData(res.data.items || res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: (info) => info.getValue() || info.row.original.cateId,
    },
    {
      accessorKey: 'categoryName',
      header: 'Category Name',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'categoryNameEng',
      header: 'Category Name (Eng)',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.active;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const id = row.original.id || row.original.cateId;
        const handleDelete = async () => {
          if (window.confirm('Are you sure you want to delete this category?')) {
            try {
              await deleteProductCategory(id);
              fetchData(); // Refresh data
            } catch (error) {
              console.error('Error deleting category:', error);
              alert('Failed to delete category');
            }
          }
        };

        return (
          <div className="flex justify-end gap-3">
            <Link href={`/categories/${id}/edit`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
              <PencilIcon className="w-5 h-5" />
            </Link>
            <button 
              onClick={handleDelete}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            >
              <TrashBinIcon className="w-5 h-5" />
            </button>
            <Link href={`/categories/${id}`} className="text-sm font-medium text-gray-700 hover:text-brand-500 dark:text-gray-300">
              Details
            </Link>
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Product Categories Management</h1>
        <Link href="/categories/create" className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium text-sm">
          + Create Category
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
        {loading ? (
          <SkeletonTable columns={5} rows={8} />
        ) : (
          <DataTable 
            columns={columns} 
            data={data} 
            searchKey="categoryName" 
            searchPlaceholder="Search category by name..." 
          />
        )}
      </div>
    </div>
  );
}
