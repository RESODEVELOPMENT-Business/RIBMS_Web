'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getPromotionsByBrand, PROMOTION_TYPE_LABELS, GIFT_TYPE_LABELS } from '@/services/promotions';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { ColumnDef } from '@tanstack/react-table';
import { PencilIcon } from '@/icons';

export default function PromotionListPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPromotionsByBrand(1, 100);
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
      accessorKey: 'promotionId',
      header: 'ID',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'promotionCode',
      header: 'Code',
      cell: (info) => (
        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
          {String(info.getValue())}
        </span>
      ),
    },
    {
      accessorKey: 'promotionName',
      header: 'Name',
      cell: (info) => (
        <span className="font-medium text-gray-900 dark:text-white">{String(info.getValue())}</span>
      ),
    },
    {
      accessorKey: 'promotionType',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.promotionType;
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
            {PROMOTION_TYPE_LABELS[type] || `Type ${type}`}
          </span>
        );
      },
    },
    {
      accessorKey: 'giftType',
      header: 'Gift Type',
      cell: ({ row }) => {
        const type = row.original.giftType;
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            {GIFT_TYPE_LABELS[type] || `Type ${type}`}
          </span>
        );
      },
    },
    {
      accessorKey: 'fromDate',
      header: 'Period',
      cell: ({ row }) => {
        const from = row.original.fromDate;
        const to = row.original.toDate;
        const fmtDate = (d: string) => {
          try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return d; }
        };
        return (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {fmtDate(from)} → {fmtDate(to)}
          </span>
        );
      },
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.active;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const id = row.original.promotionId;
        return (
          <div className="flex justify-end gap-3">
            <Link href={`/promotions/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Promotions Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage discounts, vouchers and promotions for your brand</p>
        </div>
        <Link
          href="/promotions/create"
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium text-sm shadow-sm"
        >
          + Create Promotion
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
        {loading ? (
          <SkeletonTable columns={7} rows={8} />
        ) : (
          <DataTable
            columns={columns}
            data={data}
            searchKey="promotionName"
            searchPlaceholder="Search by promotion name..."
          />
        )}
      </div>
    </div>
  );
}
