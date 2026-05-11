'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getStores } from '@/services/stores';
import { useAuthStore } from '@/store/authStore';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { ColumnDef } from '@tanstack/react-table';
import { PencilIcon } from '@/icons';

export default function StoreListPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const brandId = useAuthStore.getState().user?.brandId;
      const res = await getStores(1, 100, brandId || undefined);
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
      cell: (info) => info.getValue() || info.row.original.storeId,
    },
    {
      accessorKey: 'name',
      header: 'Store Name',
      cell: (info) => info.getValue() || info.row.original.storeName,
    },
    {
      accessorKey: 'brandId',
      header: 'Brand ID',
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
        const id = row.original.id || row.original.storeId;
        return (
          <div className="flex justify-end gap-3">
            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
              <PencilIcon className="w-5 h-5" />
            </button>
            <Link href={`/stores/${id}`} className="text-sm font-medium text-gray-700 hover:text-brand-500 dark:text-gray-300">
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Stores Management</h1>
        <Link href="/stores/create" className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium text-sm">
          + Create Store
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
        {loading ? (
          <SkeletonTable columns={5} rows={8} />
        ) : (
          <DataTable 
            columns={columns} 
            data={data} 
            searchKey="name" 
            searchPlaceholder="Search store by name..." 
          />
        )}
      </div>
    </div>
  );
}
