'use client';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getSpecialOffers, BENEFIT_TYPE_LABELS, REDEMPTION_FLOW_LABELS } from '@/services/specialOffers';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { ColumnDef } from '@tanstack/react-table';
import { PencilIcon } from '@/icons';

export default function SpecialOfferListPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = useCallback(async (pageNum = page, pageSize = size) => {
    setLoading(true);
    try {
      const res = await getSpecialOffers(pageNum, pageSize);
      if (res && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || res.data.data || [];
        setData(items);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || items.length || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchData(page, size);
  }, [fetchData, page, size]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'id', header: 'ID', cell: (info) => info.getValue() },
    {
      accessorKey: 'displayName',
      header: 'Name',
      cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{String(info.getValue())}</span>,
    },
    {
      id: 'benefits',
      header: 'Benefits',
      cell: ({ row }) => {
        const items: any[] = row.original.benefitItems || [];
        if (items.length === 0) return <span className="text-xs text-gray-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {items.map((b: any, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                {b.buyProductCode || '?'}
                {b.discountAmount ? ` -${Number(b.discountAmount).toLocaleString('vi-VN')}₫` : ''}
                {b.discountRate ? ` -${b.discountRate}%` : ''}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'storeNames',
      header: 'Stores',
      cell: ({ row }) => {
        const stores: string[] = row.original.storeNames || [];
        return <span className="text-xs text-gray-600 dark:text-gray-400">{stores.length > 0 ? stores.join(', ') : 'All'}</span>;
      },
    },
    {
      accessorKey: 'fromDate',
      header: 'Period',
      cell: ({ row }) => {
        const from = row.original.fromDate;
        const to = row.original.toDate;
        const fmt = (d: string) => { try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return d || '∞'; } };
        return <span className="text-xs text-gray-600 dark:text-gray-400">{fmt(from)} → {fmt(to)}</span>;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const a = row.original.isActive;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${a ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
            {a ? 'Active' : 'Inactive'}
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
            <Link href={`/special-offers/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
              <PencilIcon className="w-4 h-4" />
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
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Special Offer Management</h1>
        </div>
        <Link href="/special-offers/create" className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium text-sm shadow-sm">
          + Create Special Offer
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
        {loading ? (
          <SkeletonTable columns={6} rows={8} />
        ) : (
          <DataTable
            columns={columns}
            data={data}
            searchKey="displayName"
            searchPlaceholder="Search by offer name..."
            paginationMode="server"
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={size}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => { setSize(nextSize); setPage(1); }}
            defaultPageSize={size}
          />
        )}
      </div>
    </div>
  );
}
