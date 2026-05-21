'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getProducts, deleteProduct } from '@/services/products';
import { useAuthStore } from '@/store/authStore';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { ColumnDef } from '@tanstack/react-table';
import { PencilIcon, TrashBinIcon } from '@/icons';
import { formatCurrency } from '@/utils/currency';
import { Product, PRODUCT_TYPE_OPTIONS } from '@/types/product';

const PRODUCT_TYPE_MAP: Record<number, string> = Object.fromEntries(
  PRODUCT_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

export default function ProductListPage() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getProducts(1, 200);
      if (res && res.data) {
        setData(res.data.items || res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: (info) => (
        <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">{String(info.getValue())}</span>
      ),
    },
    {
      accessorKey: 'code',
      header: 'Code',
      cell: (info) => (
        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
          {String(info.getValue() || '—')}
        </span>
      ),
    },
    {
      accessorKey: 'productName',
      header: 'Product Name',
      cell: (info) => (
        <span className="font-medium text-gray-900 dark:text-white">{String(info.getValue())}</span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.original.price || 0)}
        </span>
      ),
    },
    {
      accessorKey: 'productType',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.productType ?? 0;
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
            {PRODUCT_TYPE_MAP[type] || `Type ${type}`}
          </span>
        );
      },
    },
    {
      accessorKey: 'productCategoryName',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.original.productCategoryName || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.active;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const id = row.original.id;
        return (
          <div className="flex justify-end gap-3">
            <Link
              href={`/products/${id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              Details
            </Link>
            <button
              onClick={() => id != null && handleDelete(id)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              <TrashBinIcon className="w-4 h-4" />
            </button>
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Products Management</h1>
        </div>
        <Link
          href="/products/create"
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium text-sm shadow-sm"
        >
          + Create Product
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
        {loading ? (
          <SkeletonTable columns={7} rows={8} />
        ) : (
          <DataTable
            columns={columns}
            data={data}
            searchKey="productName"
            searchPlaceholder="Search product by name..."
          />
        )}
      </div>
    </div>
  );
}
