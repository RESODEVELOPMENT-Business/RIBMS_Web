'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { PencilIcon, TrashBinIcon } from '@/icons';
import { deletePaymentType, getPaymentTypes, EPaymentTypeLabels, PlatformLabels } from '@/services/paymentTypes';

export default function PaymentTypesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = useCallback(async (pageNum = page, pageSize = size) => {
    setLoading(true);
    try {
      const res = await getPaymentTypes(pageNum, pageSize);
      if (res && res.data) {
        setData(res.data.items || res.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || (res.data.items || res.data).length || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payment types');
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchData(page, size);
  }, [fetchData, page, size]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: (info) => info.getValue() || info.row.original.paymentTypeId,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: (info) => String(info.getValue() || '-'),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const typeVal = row.original.type as number | undefined;
        return (
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {typeVal !== undefined ? EPaymentTypeLabels[typeVal] ?? typeVal : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'platform',
      header: 'Platform',
      cell: ({ row }) => {
        const platformVal = row.original.platform as number | undefined;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            platformVal === 0 ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
            platformVal === 1 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
            platformVal === 2 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {platformVal !== undefined ? PlatformLabels[platformVal] ?? platformVal : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'position',
      header: 'Position',
      cell: (info) => String(info.getValue() ?? '-'),
    },
    {
      accessorKey: 'icon',
      header: 'Icon',
      cell: (info) => String(info.getValue() || '-'),
    },
    {
      accessorKey: 'isDisplay',
      header: 'Display',
      cell: ({ row }) => {
        const isDisplay = !!row.original.isDisplay;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDisplay ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
            {isDisplay ? 'Shown' : 'Hidden'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const id = row.original.id || row.original.paymentTypeId;
        const handleDelete = async () => {
          if (!window.confirm('Delete this payment type?')) return;
          try {
            await deletePaymentType(id);
            toast.success('Payment type deleted');
            fetchData();
          } catch (error: any) {
            toast.error(`Failed to delete payment type: ${error.message}`);
          }
        };

        return (
          <div className="flex justify-end gap-3">
            <Link href={`/payment-types/${id}/edit`} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
              <PencilIcon className="w-4 h-4" />
              Edit
            </Link>
            <button onClick={handleDelete} className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
              <TrashBinIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Payment Types</h1>
        </div>
        <Link href="/payment-types/create" className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium text-sm shadow-sm">
          + Create Payment Type
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
        {loading ? (
          <SkeletonTable columns={6} rows={8} />
        ) : (
          <DataTable
            columns={columns}
            data={data}
            searchKey="name"
            searchPlaceholder="Search by name..."
            paginationMode="server"
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={size}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setSize(nextSize);
              setPage(1);
            }}
            defaultPageSize={size}
          />
        )}
      </div>
    </div>
  );
}