'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getProductDetailMappings, deleteProductDetailMapping } from '@/services/productDetailMappings';
import { useAuthStore } from '@/store/authStore';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { ColumnDef } from '@tanstack/react-table';
import { PencilIcon, TrashBinIcon } from '@/icons';
import { formatCurrency } from '@/utils/currency';
import { ProductDetailMapping } from '@/types/product';

export default function ProductDetailMappingListPage() {
  const [data, setData] = useState<ProductDetailMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    storeId: '',
    active: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (filterValues = filters) => {
    try {
      const brandId = useAuthStore.getState().user?.brandId;
      
      const res = await getProductDetailMappings(
        1, 
        100, 
        brandId || undefined,
        undefined, // productId - removed since we're using search
        filterValues.storeId ? Number(filterValues.storeId) : undefined,
        filterValues.active !== '' ? filterValues.active === 'true' : undefined
      );
      
      let filteredData = res.data?.items || res.data || [];
      
      // Client-side search by product name
      if (filterValues.search) {
        filteredData = filteredData.filter((item: ProductDetailMapping) => 
          item.product?.productName?.toLowerCase().includes(filterValues.search.toLowerCase())
        );
      }
      
      setData(filteredData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchData(newFilters);
  };

  const columns = useMemo<ColumnDef<ProductDetailMapping>[]>(() => [
    {
      accessorKey: 'productDetailId',
      header: 'ID',
    },
    {
      accessorKey: 'productName',
      header: 'Product Name',
    },
    {
      accessorKey: 'storeName',
      header: 'Store Name',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => {
        const price = row.original.price;
        const discountPrice = row.original.discountPrice;
        return (
          <div className="flex flex-col">
            <span className={discountPrice ? 'line-through text-gray-500' : ''}>
              {formatCurrency(price)}
            </span>
            {discountPrice && (
              <span className="text-red-500 text-sm font-medium">
                {formatCurrency(discountPrice)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'discountPercent',
      header: 'Discount %',
      cell: ({ row }) => {
        const value = row.original.discountPercent;
        return value ? (
          <span className="text-red-600 font-medium">
            -{value}%
          </span>
        ) : '-';
      },
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
        const id = row.original.productDetailId;
        const handleDelete = async () => {
          if (window.confirm('Are you sure you want to delete this mapping?')) {
            try {
              await deleteProductDetailMapping(id);
              fetchData(); // Refresh data
            } catch (error) {
              console.error('Error deleting mapping:', error);
              alert('Failed to delete mapping');
            }
          }
        };

        return (
          <div className="flex justify-end gap-3">
            <Link href={`/product-detail-mappings/${id}/edit`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
              <PencilIcon className="w-5 h-5" />
            </Link>
            <button 
              onClick={handleDelete}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            >
              <TrashBinIcon className="w-5 h-5" />
            </button>
            <Link href={`/product-detail-mappings/${id}`} className="text-sm font-medium text-gray-700 hover:text-brand-500 dark:text-gray-300">
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Product Store Mappings Management</h1>
        <Link href="/product-detail-mappings/create" className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium text-sm">
          + Create Mapping
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Search Product</label>
            <input
              type="text"
              placeholder="Search product name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Store ID</label>
            <input
              type="number"
              placeholder="Filter by Store ID"
              value={filters.storeId}
              onChange={(e) => handleFilterChange('storeId', e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Status</label>
            <select
              value={filters.active}
              onChange={(e) => handleFilterChange('active', e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ search: '', storeId: '', active: '' });
                fetchData({ search: '', storeId: '', active: '' });
              }}
              className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
        {loading ? (
          <SkeletonTable columns={8} rows={8} />
        ) : (
          <DataTable 
            columns={columns} 
            data={data} 
            searchKey="productName" 
            searchPlaceholder="Search by product or store name..." 
          />
        )}
      </div>
    </div>
  );
}
